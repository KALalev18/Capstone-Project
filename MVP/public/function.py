# Replace the entire file with this fixed version

import os
import ast
import json
import subprocess
import re
import concurrent.futures
import networkx as nx
import matplotlib
matplotlib.use("Agg")  
from typing import Dict, List, Any, Optional
from pathlib import Path
import matplotlib.pyplot as plt
import base64
import io
import sys
import traceback

OUTPUT_DIR = "output"
MAX_WORKERS = 4

EXCLUDE_DIRS = {"venv", ".venv", "node_modules", ".git", "__pycache__"}
SUPPORTED_EXTENSIONS = {"py", "js", "java", "html", "css", "c"}

def generate_graph(data: Dict[str, Any]):
    """
    Generates a graph visualization for all functions in a single file and returns it as a base64 encoded string.
    Handles empty graphs gracefully.
    """
    G = nx.DiGraph()
    
    # Add all functions as nodes
    for key in data.keys():
        G.add_node(key, label=key)
    
    # Add edges for function calls
    for key, value in data.items():
        if isinstance(value, dict) and "calls" in value:
            for call in value["calls"]:
                G.add_edge(key, call)
    
    # Handle empty graphs
    if len(G.nodes()) == 0:
        print("No functions found in the file.")
        # Create figure with dark background
        plt.figure(figsize=(10, 8), facecolor='#393939')
        plt.text(0.5, 0.5, "No functions found", 
                 horizontalalignment='center', verticalalignment='center', 
                 fontsize=14, color='white')  # White text on dark background
        plt.axis('off')
    else:
        # Adjust figure size based on the number of nodes (maintain original sizes)
        node_count = len(G.nodes())
        figsize = (max(14, node_count * 1.5), max(12, node_count * 1.2))
        plt.figure(figsize=figsize, facecolor='#393939')  # Dark background
        
        # Use circular layout for better distribution of nodes
        pos = nx.circular_layout(G)
        
        # Draw edges with red arrows (keep as requested)
        nx.draw_networkx_edges(
            G,
            pos,
            edge_color="#FF0000",  # Keep red arrows as requested
            width=2.0,
            alpha=1.0,
            arrowsize=20,
            arrowstyle='-|>',
            connectionstyle='arc3,rad=0.4'
        )
        
        # Draw labels for all nodes with white text
        labels = nx.get_node_attributes(G, "label")
        nx.draw_networkx_labels(
            G,
            pos,
            labels=labels,
            font_size=12,
            font_color="#FFFFFF",  # White text for dark background
            font_weight="bold",
        )
        
        # Add margins around the graph (keep original margins)
        plt.margins(0.3)
        plt.title("Function Relationship Graph", fontsize=16, fontweight="bold", 
                 pad=20, color='white')  # White title
        plt.axis("off")
    
    # Save the graph to a BytesIO object with dark background
    buf = io.BytesIO()
    try:
        plt.savefig(buf, format="png", bbox_inches="tight", 
                   facecolor='#393939', dpi=300)  # Keep original DPI
    except Exception as e:
        print(f"Error saving graph: {e}")
        print(f"Graph data: {data}")  # Log the data for debugging
        return None
    finally:
        plt.close()
    
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    return image_base64

def find_code_files(directory: str) -> Dict[str, List[str]]:
    code_files = {ext: [] for ext in SUPPORTED_EXTENSIONS}
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            ext = file.split(".")[-1].lower()
            if ext in code_files:
                code_files[ext].append(os.path.join(root, file))
    return code_files

def extract_functions(file_path: str) -> Dict[str, Any]:
    """Extracts function definitions and calls from a Python file."""
    functions = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=file_path)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_name = node.name
                args = [arg.arg for arg in node.args.args]
                functions[func_name] = {"args": args, "calls": []} # Ensure calls list is initialized
                # Find function calls within this function
                for subnode in ast.walk(node):
                    if isinstance(subnode, ast.Call) and isinstance(subnode.func, ast.Name):
                        functions[func_name]["calls"].append(subnode.func.id)
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    return functions

def extract_functions_js(file_path: str) -> Dict[str, Any]:
    """Extracts function definitions and calls from a JavaScript file."""
    functions = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Find traditional function declarations
        func_declarations = re.findall(r'function\s+(\w+)\s*\(([^)]*)\)\s*\{', content)
        for name, args in func_declarations:
            functions[name] = {"args": args.split(","), "calls": []}
        
        # Find arrow functions assigned to variables
        arrow_funcs = re.findall(r'(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>\s*\{', content)
        for name in arrow_funcs:
            if name not in functions:
                functions[name] = {"args": [], "calls": []}
        
        # Find function calls
        for func_name, func_data in functions.items():
            # Create pattern to find the function body
            # This is simplified and may not handle all JS patterns
            pattern = r'function\s+' + re.escape(func_name) + r'\s*\([^)]*\)\s*\{([\s\S]*?)\}'
            
            matches = re.findall(pattern, content)
            
            if not matches:
                # Try to find arrow function body
                arrow_pattern = re.escape(func_name) + r'\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>\s*\{([\s\S]*?)\}'
                matches = re.findall(arrow_pattern, content)
            
            if matches:
                func_body = matches[0]
                # Find all potential function calls
                for other_func in functions.keys():
                    if other_func != func_name:  # Avoid self-calls for clarity
                        call_pattern = r'\b' + re.escape(other_func) + r'\s*\('
                        if re.search(call_pattern, func_body):
                            func_data["calls"].append(other_func)
    except Exception as e:
        print(f"Error parsing JavaScript file {file_path}: {e}")
        traceback.print_exc()
    return functions

def extract_functions_java(file_path: str) -> Dict[str, Any]:
    """Extracts method definitions and calls from a Java file."""
    functions = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Find method definitions
        method_pattern = r'(?:public|private|protected|static|final|\s)*\s+\w+\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}'
        matches = re.findall(method_pattern, content)
        
        for name, args, body in matches:
            functions[name] = {"args": [arg.strip() for arg in args.split(',') if arg.strip()], "calls": []}
            
            # Find method calls within this method
            for other_func_name in [m[0] for m in matches]:
                if other_func_name != name:
                    call_pattern = r'\b' + re.escape(other_func_name) + r'\s*\('
                    if re.search(call_pattern, body):
                        functions[name]["calls"].append(other_func_name)
    except Exception as e:
        print(f"Error parsing Java file {file_path}: {e}")
    return functions

def extract_functions_c(file_path: str) -> Dict[str, Any]:
    """Extracts function definitions and calls from a C file."""
    functions = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Remove comments and preprocess
        content = re.sub(r'/\*[\\s\S]*?\*/', '', content)  # Remove block comments
        content = re.sub(r'//.*', '', content)  # Remove line comments
        
        # Find function definitions with their bodies
        func_pattern = r'(?:\w+\s+)*(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}'
        matches = re.findall(func_pattern, content)
        
        for name, args, body in matches:
            functions[name] = {"args": [arg.strip() for arg in args.split(',') if arg.strip()], "calls": []}
            
            # Find function calls within this function
            for other_func_name in [m[0] for m in matches]:
                if other_func_name != name:
                    call_pattern = r'\b' + re.escape(other_func_name) + r'\s*\('
                    if re.search(call_pattern, body):
                        functions[name]["calls"].append(other_func_name)
    except Exception as e:
        print(f"Error parsing C file {file_path}: {e}")
    return functions

def extract_functions_html(file_path: str) -> Dict[str, Any]:
    """Extracts elements, scripts and relationships from an HTML file."""
    functions = {}
    try:
        from bs4 import BeautifulSoup
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Parse HTML content
        soup = BeautifulSoup(content, 'html.parser')
        
        # Extract inline scripts and functions
        scripts = soup.find_all('script')
        for i, script in enumerate(scripts):
            if script.string:
                # Find function declarations in inline scripts
                func_declarations = re.findall(r'function\s+(\w+)\s*\(([^)]*)\)\s*\{', script.string)
                for name, args in func_declarations:
                    functions[name] = {"args": args.split(","), "calls": []}
                
                # Find arrow functions
                arrow_funcs = re.findall(r'(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>\s*\{', script.string)
                for name in arrow_funcs:
                    if name not in functions:
                        functions[name] = {"args": [], "calls": []}
                
                # Find event handlers in the document
                event_handlers = re.findall(r'addEventListener\(\s*[\'"](\w+)[\'"]\s*,\s*(\w+)', script.string)
                for event, handler in event_handlers:
                    handler_name = f"on{event}"
                    if handler in functions:
                        if handler_name not in functions:
                            functions[handler_name] = {"args": ["event"], "calls": [handler]}
                        else:
                            functions[handler_name]["calls"].append(handler)
        
        # Extract event handlers from HTML attributes
        for tag in soup.find_all(lambda tag: any(attr.startswith('on') for attr in tag.attrs)):
            for attr, value in tag.attrs.items():
                if attr.startswith('on'):
                    # Extract function calls from inline event handlers
                    calls = re.findall(r'(\w+)\s*\(', value)
                    if calls:
                        handler_name = f"{attr}_{tag.name}"
                        functions[handler_name] = {"args": ["event"], "calls": calls}
        
        # If no functions found, create placeholder nodes for HTML structure
        if not functions:
            # Add key HTML elements as nodes
            for i, tag in enumerate(soup.find_all(['html', 'head', 'body', 'main', 'div', 'section', 'nav', 'footer'])):
                if tag.name and tag.get('id'):
                    node_name = f"{tag.name}#{tag.get('id')}"
                elif tag.name and tag.get('class'):
                    node_name = f"{tag.name}.{'.'.join(tag.get('class'))}"
                else:
                    node_name = f"{tag.name}_{i}"
                
                functions[node_name] = {"args": [], "calls": []}
                
                # Add parent-child relationships
                if tag.parent and tag.parent.name:
                    parent_id = tag.parent.get('id', '')
                    parent_class = '.'.join(tag.parent.get('class', []))
                    if parent_id:
                        parent_name = f"{tag.parent.name}#{parent_id}"
                    elif parent_class:
                        parent_name = f"{tag.parent.name}.{parent_class}"
                    else:
                        parent_idx = list(soup.find_all()).index(tag.parent)
                        parent_name = f"{tag.parent.name}_{parent_idx}"
                    
                    if parent_name in functions:
                        functions[parent_name]["calls"].append(node_name)
    
    except ImportError:
        print("BeautifulSoup is required for HTML parsing. Install with: pip install beautifulsoup4")
    except Exception as e:
        print(f"Error parsing HTML file {file_path}: {e}")
        traceback.print_exc()
    
    return functions

def extract_functions_css(file_path: str) -> Dict[str, Any]:
    """Extracts selectors and their relationships from a CSS file."""
    functions = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Remove comments 
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)
        
        # Find all CSS selectors
        selector_pattern = r'([^{]+){\s*([^}]*)\s*}'
        matches = re.findall(selector_pattern, content)
        
        # Process each selector block
        for selector, rules in matches:
            selector = selector.strip()
            if not selector:
                continue
            
            # Create a node for each selector
            functions[selector] = {"args": [], "calls": []}
            
            # Handle nested selectors and find relationships
            for parent_selector in functions.keys():
                if parent_selector != selector:
                    # Check if this selector is a descendant of another
                    if selector.startswith(parent_selector + ' ') or \
                       selector.startswith(parent_selector + '>') or \
                       selector.startswith(parent_selector + '+') or \
                       selector.startswith(parent_selector + '~'):
                        functions[parent_selector]["calls"].append(selector)
            
            # Extract any @import or url() references
            import_pattern = r'@import\s+[\'"]([^\'"]+)[\'"]'
            imports = re.findall(import_pattern, rules)
            for imp in imports:
                import_name = f"@import_{imp}"
                functions[import_name] = {"args": [], "calls": []}
                functions[selector]["calls"].append(import_name)
            
            url_pattern = r'url\([\'"]?([^\)]+)[\'"]?\)'
            urls = re.findall(url_pattern, rules)
            for url in urls:
                url_name = f"url_{url}"
                functions[url_name] = {"args": [], "calls": []}
                functions[selector]["calls"].append(url_name)
    
    except Exception as e:
        print(f"Error parsing CSS file {file_path}: {e}")
        traceback.print_exc()
    
    return functions

def process_file(file_path: str):
    """Processes a single file and generates a graph for its functions."""
    try:
        ext = file_path.split(".")[-1].lower()
        if ext == "py":
            data = extract_functions(file_path)
        elif ext == "js":
            data = extract_functions_js(file_path)
        elif ext == "java":
            data = extract_functions_java(file_path)
        elif ext == "c":
            data = extract_functions_c(file_path)
        elif ext == "html":
            data = extract_functions_html(file_path)
        elif ext == "css":
            data = extract_functions_css(file_path)
        else:
            return None

        # Validate data
        if not data or not isinstance(data, dict):
            print(f"Invalid data extracted from {file_path}: {data}")
            return {"file": file_path, "image_base64": None}

        # Generate the graph as a base64 string
        image_base64 = generate_graph(data)

        return {"file": file_path, "image_base64": image_base64}  # Return the base64 encoded graph and filename
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        traceback.print_exc()  # Print the full traceback
        return None

def process_directory(directory: str):
    """Processes all files in a directory."""
    code_files = find_code_files(directory)
    
    image_data = []  # Collect image data
    # Process each file in the directory
    for ext, files in code_files.items():
        for file in files:
            try:
                result = process_file(file)
                if result:
                    image_data.append(result)
            except Exception as e:
                print(f"Error processing {file}: {e}")
    return image_data

def process_all_branches():
    """Processes all files in a directory."""
    directory = os.getcwd()  # Use the current working directory
    
    all_image_data = process_directory(directory)
    
    return all_image_data

def process_single_file(file_path: str):
    """Processes a single specified file."""
    if not os.path.exists(file_path):
        return [{"error": f"File not found: {file_path}"}]
    
    try:
        result = process_file(file_path)
        if result:
            return [result]
        else:
            return [{"error": f"Failed to process file: {file_path}"}]
    except Exception as e:
        traceback.print_exc()
        return [{"error": f"Exception processing file: {str(e)}"}]

# Only one main block
if __name__ == "__main__":
    # Normal operation with file path
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        image_data = process_single_file(file_path)
        print(json.dumps(image_data))
    else:
        # Otherwise process all files in the current directory
        image_data = process_all_branches()
        print(json.dumps(image_data))