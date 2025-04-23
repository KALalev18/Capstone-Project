document.getElementById("repoForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const owner = document.getElementById("owner").value;
    const repo = document.getElementById("repo").value;
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "<p>Loading...</p>";

    try {
        // Fetch commit analysis
        const response = await fetch(`/analyze/${owner}/${repo}`);
        const data = await response.json();
        resultsDiv.innerHTML = "";

        // Extract commit messages for Groq analysis
        const commitMessages = data.map(commit => commit.commitMessage);

        // Fetch Groq analysis for each commit
        const groqResponses = await Promise.all(
            commitMessages.map(async (message) => {
                try {
                    const groqResponse = await fetch(`/groq/analyze`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ messages: message })
                    });
                    return await groqResponse.json();
                } catch (err) {
                    console.error("Error fetching Groq analysis for message:", message, err);
                    return { choices: [{ message: { content: "No Groq analysis available." } }] };
                }
            })
        );

        // Display commit analysis with respective Groq analysis
        data.forEach((commit, index) => {
            const commitDiv = document.createElement("div");
            commitDiv.classList.add("commit");

            // Safely access Groq analysis
            const groqContent = groqResponses[index]?.choices?.[0]?.message?.content || "No Groq analysis available.";

            commitDiv.innerHTML = `
                <h3>${commit.author} — ${new Date(commit.date).toLocaleString()}</h3>
                <p><strong>Message:</strong> ${commit.commitMessage}</p>
                ${commit.codeComments.length > 0 ? `<p><strong>Code Comments:</strong></p><ul>` + commit.codeComments.map(c =>
                    `<li>${c.comment}</li>`).join('') + `</ul>` : "<p>No code comments found.</p>"}
                <div class="groq-analysis">
                    <h4>Groq Analysis</h4>
                    <p>${groqContent}</p>
                </div>
            `;
            resultsDiv.appendChild(commitDiv);
        });

    } catch (err) {
        console.error("Error fetching commit data or Groq analysis:", err);
        resultsDiv.innerHTML = "<p>Error fetching commit data or Groq analysis. Please check repository info or try again later.</p>";
    }
});