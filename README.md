# Yojana Setu – AI-Driven Scheme Matching

Yojana Setu is a **Smart India Hackathon (SIH) 2026 prototype** designed to help **Scheduled Caste (SC) entrepreneurs and students** identify suitable concessional credit and education-loan schemes.

The platform simplifies scheme discovery by analyzing user-specific information such as category, gender, age, annual family income, state, district, occupation, education, purpose, project type, project cost, and loan requirement.

Based on these inputs, Yojana Setu recommends the **top 3 relevant schemes** and provides additional assistance through an AI-powered chatbot, financial calculator, and map-based bank/channel-partner locator.

> **Note:** Yojana Setu is a hackathon prototype and is not an official government portal. Users should verify scheme eligibility, interest rates, loan limits, documents, and application procedures with the relevant authorized government department or financial institution.

---

## 1. Project Information

- **Project Title:** Yojana Setu – AI-Driven Scheme Matching
- **PS ID:** 26092
- **PS Title:** AI-Driven Scheme matching for Marginalized Entrepreneurs
- **Category:** Software
- **Theme:** Smart Automation 

---

## 2. Problem Statement

Scheduled Caste entrepreneurs and students have access to various government-backed financial assistance, concessional credit, and education-loan schemes.

However, identifying the right scheme can be difficult because different schemes have different:

- Eligibility criteria
- Income limits
- Age requirements
- Loan limits
- Interest rates
- Repayment periods
- Documentation requirements
- Application procedures
- Channel partners and financial institutions

Users may also find it difficult to understand the financial implications of a loan or locate the appropriate bank or channel partner for proceeding with an application.

This creates an information and accessibility gap between eligible beneficiaries and the schemes available to them.

---

## 3. Proposed Solution

Yojana Setu provides a centralized platform for discovering and understanding suitable government-backed schemes.

The user enters basic personal, educational, occupational, geographical, and financial information:

- Category
- Gender
- Age
- Annual family income
- State
- District
- Occupation
- Education
- Purpose
- Project type
- Project cost
- Loan required

The system analyzes these inputs against available scheme criteria and recommends the **top 3 suitable schemes**.

Users can then explore scheme details and use additional features such as:

- AI chatbot for scheme-related questions
- Required document guidance
- Application procedure guidance
- Financial and EMI calculator
- Bank/channel-partner locator
- Map-based navigation

The objective is to make government scheme discovery **simpler, faster, and more user-friendly**.

---

## 4. Key Features

### Personalized Scheme Matching

- Collects user-specific information
- Matches users against scheme eligibility criteria
- Recommends the top 3 relevant schemes
- Considers financial requirements such as project cost and loan amount

### AI-Powered Chatbot

Users can ask questions such as:

- What documents are required?
- Am I eligible for this scheme?
- How can I apply?
- What is the loan limit?
- What is the repayment period?
- What is the interest rate?
- Who can I contact for further assistance?

### Financial Calculator

- EMI calculation
- Loan amount estimation
- Interest calculation
- Repayment-period analysis
- Scheme-specific financial parameters where available

### Bank / Channel-Partner Locator

- Helps users identify relevant financial institutions
- Displays nearby banks or channel partners
- Provides map-based location information
- Helps users navigate to the appropriate institution

### Accessible User Interface

- Responsive design
- Simple scheme discovery workflow
- Clear presentation of eligibility and financial information
- Designed for easy access by users with different levels of technical familiarity

---

## 5. Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript
- FAST API

### Database

- MongoDB

### Authentication

- JWT Authentication
- Google Authentication

### AI

- Gemini API
- LLM-based conversational assistance
- Prompt Engineering

### Maps

- Map and location services for channel-partner discovery and navigation

### Development & Deployment

- Git
- GitHub
- VS Code
- Vercel / Cloud Deployment

---

## 6. Architecture

The system follows a client-server architecture in which the frontend collects user information and communicates with backend services through REST APIs.

```text
                         +----------------+
                         |      User      |
                         +-------+--------+
                                 |
                                 v
                     +-----------------------+
                     |   Next.js Frontend    |
                     |       React UI        |
                     +-----------+-----------+
                                 |
                                 v
                     +-----------------------+
                     |    Backend REST API   |
                     |   Node.js / Express   |
                     +-----------+-----------+
                                 |
             +-------------------+-------------------+
             |                   |                   |
             v                   v                   v
    +----------------+  +----------------+  +----------------+
    | Scheme         |  | AI Chatbot     |  | Financial      |
    | Recommendation |  | Service        |  | Calculator     |
    +-------+--------+  +----------------+  +----------------+
            |
            v
    +----------------+
    |    MongoDB     |
    |  Scheme Data   |
    +-------+--------+
            |
            v
    +----------------------+
    | Top 3 Scheme Results |
    +----------+-----------+
               |
        +------+------+
        |             |
        v             v
+---------------+  +----------------------+
| Bank / SCA /  |  | Scheme Details       |
| Partner       |  | & Guidance           |
| Locator       |  +----------------------+
+-------+-------+
        |
        v
+----------------------+
| Map & Navigation     |
+----------------------+
```

---

## 7. Repository Structure

```text
YOJANA-SETU/
│
├── README.md
│
├── frontend/
│
├── backend/
│
├── ai/
│
├── assets/
│   └── screenshots/
│
├── submissions/
│   ├── PRESENTATION.pdf
│   ├── DEMO.mp4
│   └── ...
│
└── .gitignore
```

### Folder Description

- `frontend/` – Frontend source code
- `backend/` – Backend and REST API source code
- `ai/` – AI-related code and services
- `docs/` – Project documentation and architecture
- `assets/screenshots/` – Screenshots and prototype images
- `submissions/` – Final presentation, demo video, and submission files
- `README.md` – Project overview and setup instructions

---

## 8. Final Presentation

The final SIH 2026 presentation is included in the repository.

- 📊 [View Final Presentation](submission/NIRMAN_SIH_2026_PPT.pptx)
- 📄 [Presentation Details](submission/PRESENTATION.md)

## 9. Demo Video

A demonstration video of the project is available in the submission folder.

- 🎥 [View Demo Video](submission/DEMO.md)

---

# 10. Screenshots / Prototype Photos

Important screenshots and prototype images of **Yojana Setu** are available in the `assets/screenshots/` folder.

### Screenshots

- 🏠 [Landing Page](assets/screenshots/LANDING%20PAGE.png)
- 📋 [Scheme Recommendations](assets/screenshots/SCHEME%20RECOMMENDER.png)
- 🤖 [AI Chatbot](assets/screenshots/AI%20CHATBOT.png)
- 🧮 [EMI Calculator](assets/screenshots/FINANCIAL%20CALCULATOR.png)
- 🏦 [Bank / Channel Partner Locator](assets/screenshots/PARTNER%20LOCATOR.png)

---

## 11. Installation

### Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Install Backend Dependencies

```bash
cd ../backend
npm install
```

### Environment Variables

Create the required `.env` files with the necessary configuration before running the project.

Do not commit sensitive information such as:

- API keys
- Database credentials
- JWT secrets
- Google OAuth credentials
- Other private configuration values

---

## 12. Run

### Start the Backend

```bash
cd backend
npm run dev
```

The backend server will run on:

```text
http://localhost:5000
```

### Start the Frontend

Open another terminal and run:

```bash
cd frontend
npm run dev
```

The frontend will run on:

```text
http://localhost:3000
```

Open `http://localhost:3000` in a browser to access Yojana Setu.

---

## 13. Future Scope

- Integration with more central and state government schemes
- Real-time scheme eligibility and information updates
- Multilingual support for Indian regional languages
- Voice-based AI assistance
- Improved AI-based personalized scheme recommendations
- Direct online application assistance
- Integration with more banks and channel partners
- Mobile application for Android and iOS
- Advanced loan comparison and financial planning
- Integration with additional government portals
- Notifications for newly launched and updated schemes
- Personalized financial guidance for users

---

## Important

Before submission, make sure the repository is accessible to reviewers.

Do not upload passwords, API keys, access tokens, database credentials, `.env` files containing secrets, or any other confidential credentials.
