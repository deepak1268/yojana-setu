# Yojana Setu – AI-Driven Scheme Matching

Yojana Setu is a **Smart India Hackathon (SIH) 2026 prototype** designed to help **Scheduled Caste (SC) entrepreneurs and students** identify suitable concessional credit and education-loan schemes.

The platform simplifies scheme discovery by analyzing user-specific information such as category, gender, age, annual family income, state, district, occupation, education, purpose, project type, project cost, and loan requirement.

Based on these inputs, Yojana Setu recommends the **top 3 relevant schemes** and provides additional assistance through an AI-powered chatbot, financial calculator, and map-based bank/channel-partner locator.

> **Note:** Yojana Setu is a hackathon prototype and is not an official government portal. Users should verify scheme eligibility, interest rates, loan limits, documents, and application procedures with the relevant authorized government department or financial institution.

---

## 1. Project Information

- **Project Title:** Yojana Setu – AI-Driven Scheme Matching
- **PS ID:** SIH2026
- **PS Title:** AI-Driven Scheme Matching for SC Beneficiaries
- **Category:** Software
- **Theme:** Financial Inclusion

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
- REST APIs

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
    |   Scheme       |  |  AI Chatbot    |  |   Financial    |
    | Recommendation |  |    Service     |  |   Calculator   |
    +-------+--------+  +----------------+  +----------------+
            |
            v
    +----------------+
    |    MongoDB     |
    | Scheme Data    |
    +-------+--------+
            |
            v
    +------------------------+
    | Top 3 Scheme Results   |
    +------------------------+
            |
            +--------------------+
            |                    |
            v                    v
    +---------------+    +----------------+
    | Bank / SCA /  |    | Scheme Details |
    | Partner       |    | & Guidance     |
    | Locator       |    +----------------+
    +-------+-------+
            |
            v
    +----------------+
    | Map & Navigation|
    +----------------+
