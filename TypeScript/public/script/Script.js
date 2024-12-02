document.addEventListener("DOMContentLoaded", () => {
  const checkToken = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("No token found in localStorage.");
        return;
      }

      const response = await fetch("/auth/verify-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        } else {
          console.error("An error occurred while verifying the token.");
        }
        return;
      }

      const data = await response.json();
    } catch (error) {
      console.error("Error during token verification:", error);
    }
  };

  const fetchUserProfile = async (id) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/auth/userProfile/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Error fetching user info:", response.statusText);
        return null;
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchAllPosts = async () => {
    try {
      const response = await fetch("/posts/fetchAllPosts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        console.error("Error fetching posts:", response.statusText);
        return;
      }

      const data = await response.json();
      console.log("Fetched posts:", data);

      const postsContainer = document.getElementById("posts-container");
      postsContainer.innerHTML = "";
      for (const post of data) {
        const user = await fetchUserProfile(post.user_id);
        if (!user) {
          continue;
        }

        const postElement = document.createElement("div");
        postElement.classList.add(
          "card",
          "mb-4",
          "shadow-lg",
          "bg-white",
          "rounded-lg"
        );

        postElement.innerHTML = `
    <div class="card-body p-4">
      <!-- User Info Section -->
      <div class="flex items-center mb-4">
        <img src="${"../Images/DefualtUser.png"}" alt="${
          user.username || "User"
        }'s profile" class="w-12 h-8 rounded-full mr-3">
        <h5 class="card-title text-xl font-semibold text-gray-700">${
          user.username || "User"
        }</h5> <!-- User's username -->
      </div>

      <!-- Post Content Section -->
      <p class="card-text text-gray-600 mb-4">${post.content}</p>

      <!-- Post Interaction Buttons -->
      <div class="flex justify-between items-center">
        <button class="btn btn-outline-primary btn-sm hover:bg-blue-100 transition-colors">
          <i class="bi bi-heart text-lg"></i> Like
        </button>
        <button class="btn btn-outline-secondary btn-sm hover:bg-gray-100 transition-colors">
          <i class="bi bi-chat-dots text-lg"></i> Comment
        </button>
      </div>
    </div>
  `;

        postsContainer.appendChild(postElement);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  checkToken();
  fetchAllPosts();
});

function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "/login";
}
