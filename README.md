# Collabmate

Collabmate is a web-based application designed to help educators and students monitor participation in group projects. The platform enables anonymous peer feedback, task tracking, and performance analysis to ensure fair and effective collaboration.

## Features

- **Anonymous Peer Feedback:** Students can provide feedback on their group members without revealing their identity.
- **Task Tracking:** Assign, manage, and monitor tasks within group projects.
- **Performance Analysis:** Visualize and analyze individual and group contributions.
- **User Authentication:** Secure login and registration for all users.
- **Role Management:** Different roles for students, educators, and administrators.

## Tech Stack

- **Frontend:** React, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (via Drizzle ORM)
- **Authentication:** Passport.js
- **ORM & Migrations:** Drizzle Kit
- **Other:** RESTful API, session management

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/groupwork-tracker.git
   cd groupwork-tracker/collabmate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Edit `.env` with your PostgreSQL credentials:
   ```
   DATABASE_URL=postgres://TerryEkoeAziaba:yourpassword@localhost:5432/collabmate
   ```

4. **Run database migrations:**
   ```bash
   npx drizzle-kit migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Folder Structure

- `/client` — Frontend code (React)
- `/server` — Backend code (Express, Passport.js)
- `/shared` — Shared types and schema
- `/migrations` — Database migration files

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT

---

*Collabmate helps students and educators collaborate more effectively and fairly.*