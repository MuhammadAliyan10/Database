document.addEventListener("DOMContentLoaded", () => {
  const fetchUserData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("User not authenticated!");
      return;
    }

    try {
      const res = await fetch("/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      const { user } = await res.json();

      document.getElementById("profileImg").src =
        user.profile_image || "https://via.placeholder.com/150?text=No+Image";
      document.getElementById("fullName").innerText =
        user.full_name || "Full Name Not Provided";
      document.getElementById("email").innerText =
        user.email || "Email Not Provided";
      document.getElementById("username").innerText = user.username
        ? `Username: ${user.username}`
        : "Username: Not provided";
      document.getElementById("bio").innerText = user.bio
        ? `Bio: ${user.bio}`
        : "Bio: Not provided";
      document.getElementById("joinedDate").innerText = new Date(
        user.created_at
      ).toLocaleDateString();
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("Failed to load user data. Please try again.");
    }
  };

  fetchUserData();
});

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      const profileImg = document.getElementById("profileImg");
      const base64Image = e.target.result;

      profileImg.src = base64Image;
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("No token found");
          return;
        }

        console.log("Sending image to backend...");

        const response = await fetch("/auth/profile/image", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profile_image: base64Image }),
        });

        const result = await response.json();
        if (response.ok) {
          console.log("Image uploaded and saved to the database");
        } else {
          console.error("Error uploading image:", result.message);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    };

    reader.readAsDataURL(file); // Convert the file to Base64
  }
};
