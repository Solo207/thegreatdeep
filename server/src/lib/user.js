// The same user details for every n8n request: userId, email, userName
export const userDetails = (req) => ({
  userId: req.user.id,
  email: req.user.email,
  userName: req.user.name,
});