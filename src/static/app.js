document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message and reset activity select
  activitiesList.innerHTML = "";
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Main info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (built with DOM methods to avoid HTML injection)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsDiv.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list no-bullets";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const badge = document.createElement("span");
            badge.className = "participant-badge";
            // Create initials from email local part (before @), using dots/dashes/underscores as separators
            const namePart = String(p).split("@")[0] || "";
            const initials = namePart
              .split(/[^a-zA-Z0-9]+/)
              .filter(Boolean)
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            badge.textContent = initials || "?";

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = p;

              // 削除アイコン
              const deleteIcon = document.createElement("span");
              deleteIcon.className = "delete-participant";
              deleteIcon.innerHTML = "&#128465;"; // ゴミ箱アイコン
              deleteIcon.title = "Unregister participant";
              deleteIcon.setAttribute("data-activity", name);
              deleteIcon.setAttribute("data-email", p);

            li.appendChild(badge);
            li.appendChild(emailSpan);
              li.appendChild(deleteIcon);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "info";
          none.textContent = "No participants yet.";
          participantsDiv.appendChild(none);
        }

        activityCard.appendChild(participantsDiv);

  // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
        
  // Append the fully-built card to the activities list
  activitiesList.appendChild(activityCard);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle participant unregistration
  activitiesList.addEventListener("click", async (event) => {
    const deleteIcon = event.target.closest(".delete-participant");
    if (!deleteIcon) return;

    const activity = deleteIcon.getAttribute("data-activity");
    const email = deleteIcon.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        // 削除が成功したら、アクティビティリストを更新
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // 5秒後にメッセージを非表示
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
