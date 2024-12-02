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
function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
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
        "bg-[#ffffff62]",
        "shadow-lg",
        "backdrop-blur-md",
        "rounded-lg"
      );

      postElement.innerHTML = `
<div class="card-body p-4">
  <!-- User Info Section -->
  <div class="flex justify-between items-center mb-4">
    <div class="flex items-center">
      <img src="${"../Images/DefualtUser.png"}" alt="${
        user.username || "User"
      }'s profile" class="w-10 h-9 rounded-full mr-3">
      <h5 class="card-title text-xl font-semibold text-gray-700">${
        user.username || "User"
      }</h5>
    </div>
  <p class="text-sm text-gray-500">${formatDate(
    post.created_at
  )}</p> <!-- Post created time -->
  </div>

  <!-- Light Line Breaker -->
  <div class="border-b-[0.5px] border-gray-600 my-3"></div>

  <!-- Post Content Section -->
  <p class="card-text text-white mb-4">${post.content}</p>

  <!-- Another Light Line Breaker -->
  <div class="border-b-[0.5px] border-gray-600 my-3"></div>

  <!-- Post Interaction Buttons -->
  <div class="flex justify-between items-center">
    <button class="btn btn-outline-primary btn-sm hover:bg-blue-100 transition-colors">
      <i class="fa-solid fa-thumbs-up"></i> Like
    </button>
    <button class="btn btn-outline-secondary btn-sm hover:bg-gray-100 transition-colors">
      <i class="fa-solid fa-comment"></i> Comment
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

  checkToken();
  fetchAllPosts();
});

function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "/login";
}

function postText() {
  const token = localStorage.getItem("authToken");
  const postContent = document.getElementById("postContent").value;

  if (!postContent) {
    alert("Please enter a post content.");
    return;
  }

  fetch("/posts/addPost", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ post_type: "text", content: postContent }),
  })
    .then((response) => {
      if (!response.ok) {
        console.error("Error creating post:", response.statusText);
        return;
      }

      document.getElementById("postContent").value = "";
      alert("Post created successfully!");
      fetchAllPosts();
    })
    .catch((error) => {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    });
}
