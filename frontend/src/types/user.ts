export type UserProfile = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  avatarUrl: string;
  phone: string;
  location: string;
  joinDate: string;
  stats: {
    booksAdded: number;
    booksRead: number;
    favoriteGenre: string;
  };
};