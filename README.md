# VitalityAI

VitalityAI is an AI-powered health & fitness web application that
provides personalized coaching through real-time chat and voice
interaction. The system uses machine-learning intent classification
(Logistic Regression and SVM) to route users to specialized chatbot
personas such as general health, workout, and nutrition assistants.

## 🚀 Features

-   Real-time AI chat using OpenAI APIs\
-   Voice interaction capabilities\
-   Intent classifier trained on 300+ health and fitness FAQs\
-   Routing across 10+ custom chatbot personas\
-   Built with Next.js and Tailwind\
-   Local development with hot reload

# 📦 Project Setup

## 1. Clone the Repository

    git clone <your-repo-url>
    cd vitalityai

# 🔐 2. Environment Variables

Create a file named `.env.local` in the /vitalityai root directory:

    OPENAI_API_KEY=(will be attached in the submission textbox)
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=(will be attached in the submission textbox)
    NEXT_PUBLIC_GOOGLE_MAPS_JAVASCRIPT_API_KEY=(will be attached in submission textbox)


# 📥 3. Install Dependencies

    npm i

# ▶️ 4. Run the Development Server

    npm run dev

Access the application at **http://localhost:3001**

# ✔️ Summary

  Step   Description
  ------ -----------------------
  1      Clone repository
  2      Create `.env.local`
  3      Install dependencies
  4      Run dev server
  5      Open localhost:3001

# 🛠 Tech Stack

-   Next.js\
-   Tailwind CSS\
-   OpenAI API\
-   Python + scikit-learn\
-   Node.js\
-   Google Maps API
