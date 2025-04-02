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

REPO_URL = "https://github.com/KALalev18/Capstone-Project"
CLONE_DIR = "repo_clone"
OUTPUT_DIR = "output"
MAX_WORKERS = 4

EXCLUDE_DIRS = {"venv", ".venv", "node_modules", ".git", "__pycache__"}
SUPPORTED_EXTENSIONS = {"py", "js", "java", "html", "css"}

def generate_graph(data: Dict[str, Any], output_path: str, max_label_length: int = 15):
    """
    Generates a graph visualization for the functions in a single file.
    Function names are abbreviated to fit inside the nodes.
    """
    G = nx.DiGraph()
    for key, value in data.items():
        abbreviated_label = key if len(key) <= max_label_length else key[:max_label_length - 3] + "..."
        G.add_node(key, label=abbreviated_label) 
        if isinstance(value, dict) and "calls" in value:
            for call in value["calls"]:
                G.add_edge(key, call)
    plt.figure(figsize=(14, 12))  
    pos = nx.spring_layout(G, seed=42) 
    nx.draw_networkx_nodes(
        G,
        pos,
        node_color="#87CEEB",  
        node_size=4000,  
        node_shape="s",  
    )
    nx.draw_networkx_edges(
        G,
        pos,
        edge_color="#A9A9A9", 
        width=1.5,  
        alpha=0.8,  
    )
    labels = nx.get_node_attributes(G, "label")
    nx.draw_networkx_labels(
        G,
        pos,
        labels=labels,
        font_size=8,  
        font_color="#000000",  
        font_weight="bold",  
        verticalalignment="center",
    )
    plt.title("Function Relationship Graph", fontsize=16, fontweight="bold")
    plt.axis("off")  
    plt.savefig(output_path, bbox_inches="tight", dpi=300) 
    plt.close()  
    print(f"Graph saved to {output_path}")
def clone_or_pull_repo():
    if not os.path.exists(CLONE_DIR):
        print(f"Cloning repository from {REPO_URL}...")
        subprocess.run(["git", "clone", REPO_URL, CLONE_DIR], check=True)
    else:
        try:
            print("Updating existing repository...")
            subprocess.run(["git", "-C", CLONE_DIR, "fetch", "--all"], check=True)
            subprocess.run(["git", "-C", CLONE_DIR, "reset", "--hard", "origin/main"], check=True)
            subprocess.run(["git", "-C", CLONE_DIR, "clean", "-fd"], check=True)
        except subprocess.CalledProcessError:
            print("Git update failed. Performing fresh clone...")
            import shutil
            shutil.rmtree(CLONE_DIR, ignore_errors=True)
            subprocess.run(["git", "clone", REPO_URL, CLONE_DIR], check=True)
def get_branches() -> List[str]:
    result = subprocess.run(["git", "-C", CLONE_DIR, "branch", "-r"], capture_output=True, text=True)
    return [line.strip().split("origin/")[-1] for line in result.stdout.split("\n") if "origin/HEAD" not in line and line.strip()]
def checkout_branch(branch: str):
    print(f"Checking out branch: {branch}")
    subprocess.run(["git", "-C", CLONE_DIR, "checkout", branch], check=True)
def find_code_files() -> Dict[str, List[str]]:
    code_files = {ext: [] for ext in SUPPORTED_EXTENSIONS}
    for root, dirs, files in os.walk(CLONE_DIR):
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
                functions[func_name] = {"args": args, "calls": []}
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
        matches = re.findall(r'function\s+(\w+)\s*\(([^)]*)\)', content)
        for name, args in matches:
            functions[name] = {"args": args.split(","), "calls": []}
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    return functions
def extract_functions_java(file_path: str) -> Dict[str, Any]:
    """Extracts method definitions and calls from a Java file."""
    functions = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        matches = re.findall(r'\b(public|private|protected|static|final)*\s+\w+\s+(\w+)\s*\(([^)]*)\)', content)
        for _, name, args in matches:
            functions[name] = {"args": args.split(","), "calls": []}
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    return functions
def process_file(file_path: str, branch_dir: Path):
    """Processes a single file and generates a graph for its functions."""
    try:
        ext = file_path.split(".")[-1]
        if ext == "py":
            data = extract_functions(file_path)
        elif ext == "js":
            data = extract_functions_js(file_path)
        elif ext == "java":
            data = extract_functions_java(file_path)
        else:
            return None
        # Create a directory for the file inside the branch folder
        file_name = Path(file_path).stem
        file_dir = branch_dir / file_name
        file_dir.mkdir(parents=True, exist_ok=True)
        # Save the summary as JSON
        summary_file = file_dir / "summary.json"
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        # Generate and save the graph
        graph_output_path = file_dir / f"{file_name}_graph.png"
        generate_graph(data, str(graph_output_path))

        print(f"Processed file: {file_path}")
        return data
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None
def process_branch(branch: str):
    """Processes all files in a branch."""
    print(f"Processing branch: {branch}")
    checkout_branch(branch)
    code_files = find_code_files()
    branch_dir = Path(OUTPUT_DIR) / branch
    branch_dir.mkdir(parents=True, exist_ok=True)
    # Process each file in the branch
    for ext, files in code_files.items():
        for file in files:
            try:
                process_file(file, branch_dir)
            except Exception as e:
                print(f"Error processing {file}: {e}")
def process_all_branches():
    """Processes all branches in the repository."""
    print("Starting repository analysis...")
    clone_or_pull_repo()
    branches = get_branches()
    print(f"Found {len(branches)} branches: {', '.join(branches)}")
    for branch in branches:
        try:
            process_branch(branch)
        except Exception as e:
            print(f"Failed to process branch {branch}: {e}")
    print("\nAnalysis complete. Results saved to:", OUTPUT_DIR)

if __name__ == "__main__":
    process_all_branches()

# pip install networkx is needed for this code to run
# This code will clone the repository, analyze the code files in each branch,
# and generate a graph visualization for the functions in each file.
# The graphs will be saved in the output directory, organized by branch and file name.
# The summary of function definitions and calls will be saved in JSON format.