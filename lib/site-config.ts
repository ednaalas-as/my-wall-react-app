/**
 * The person whose wall this is. Edit these values (and replace
 * public/profile-placeholder.svg with your own photo) to personalise the wall.
 */
export const wallOwner = {
  name: "Your Name",
  status: "is building a wall with React, Next.js and Supabase.",
  photo: "/profile-placeholder.svg",
  info: [
    { label: "Networks", value: "SUpost" },
    { label: "Current City", value: "San Francisco, CA" },
    { label: "Looking For", value: "Software developer roles" },
    { label: "Interests", value: "React, TypeScript, databases" },
  ],
} as const;

export const siteName = "my wall";
