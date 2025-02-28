EasyGrill - Real-Time Ordering and Management System
Project Overview
EasyGrill is a web-based ordering management and billing system with analytics, designed specifically for SeoulMeat Korean Grill House, a samgyeopsal restaurant offering unlimited Korean dishes. This system was developed as a capstone project for our Bachelor of Science in Information Technology (BSIT) program at the Polytechnic University of the Philippines – Santa Maria Campus. It aims to streamline the restaurant's manual processes by digitalizing the ordering and billing workflows, eliminating inefficiencies such as order inaccuracies, frequent customer-staff interactions, and time-consuming manual calculations. The project enhances the dining experience for customers while providing operational efficiency and data-driven insights for restaurant management.
The system operates in real-time, enabling seamless communication between customers, kitchen staff, and administrators. Customers can place orders directly from their tables using their personal devices (smartphones or tablets), while the kitchen staff receives these orders instantly on a dedicated monitor. Administrators benefit from automated billing and analytics features that provide valuable business insights.
Features
Customer-Side Ordering: Customers scan a QR code or input a PIN to access a digital menu on their devices, allowing them to browse categories (e.g., main dishes, side dishes, drinks) and place orders without staff assistance. Orders are tracked in real-time with statuses like "pending," "preparing," and "served."

Admin-Side Management: Administrators can manage tables, create new orders, monitor active sessions, and access analytics such as customer counts, most-ordered items, and sales trends. The system also generates digital receipts.

Kitchen-Side Order Processing: Kitchen staff receive real-time order updates on a dedicated screen, enabling them to prepare and mark items as "preparing" or "served" instantly.

Billing and Analytics: The system automates bill calculations based on customer headcounts and packages, eliminating manual tallying. Analytics provide insights into ordering trends and sales performance (daily, weekly, or monthly).

Real-Time Updates: Leveraging Supabase’s real-time capabilities, the system ensures that all changes (e.g., new orders, status updates) are reflected instantly across all interfaces.

Tools and Technologies
EasyGrill was built using a modern tech stack to ensure scalability, performance, and an intuitive user experience as part of our academic capstone project:
Next.js: A React framework used for building the web application, providing server-side rendering, static site generation, and an optimized development experience. It powers the front-end interfaces for both customer and admin sides.

TypeScript: Adds static typing to JavaScript, improving code reliability, maintainability, and developer productivity by catching errors during development.

Supabase: An open-source Firebase alternative used as the backend-as-a-service. It handles the database (PostgreSQL), real-time subscriptions, and API generation. Supabase enables real-time data syncing between customers, kitchen staff, and admins, and stores data such as menu items, orders, and analytics.

Tailwind CSS: A utility-first CSS framework used to design responsive, modern, and visually appealing user interfaces quickly and efficiently. It ensures a consistent and mobile-friendly design across all system components.

Vercel: The hosting platform used to deploy EasyGrill. Vercel simplifies the deployment process, providing automatic scaling, domain management, and a seamless workflow for hosting Next.js applications.

System Architecture
Frontend: Built with Next.js and TypeScript, styled using Tailwind CSS. The customer interface is accessible via QR codes, while the admin and kitchen interfaces are secured with authentication.

Backend: Powered by Supabase, which provides a PostgreSQL database and real-time APIs. Data is managed through tables such as orders, order_items, menu_items, and tables, with relationships defined in the Entity-Relationship Diagram (see Appendix O).

Hosting: Deployed on Vercel, ensuring fast, reliable access to the application with automatic scaling to handle traffic.

Real-Time Functionality: Supabase’s real-time subscriptions ensure that updates (e.g., a customer placing an order or a kitchen staff marking it as "served") are instantly propagated to all connected clients.

How It Works
Customer Experience: Customers scan a QR code provided by the staff to access the EasyGrill app on their devices. They browse the menu, add items to their cart (up to a maximum of 5 per item), and submit orders, which appear on the kitchen screen.

Kitchen Workflow: Kitchen staff view incoming orders in real-time, update their statuses (e.g., "preparing" to "served"), and clear completed orders from the screen.

Admin Operations: Admins manage tables, assign customers, monitor orders, and review analytics. Upon checkout, the system generates a digital receipt and updates the table status to "available."

Analytics: The system tracks order data and customer trends, presenting them in visual formats (e.g., bar graphs) for business decision-making.

Live Demo
You can explore the live version of EasyGrill hosted on Vercel:
Admin Interface: https://grill-house-plum.vercel.app/admin  

Why It Matters
Developed as a capstone project, EasyGrill replaces SeoulMeat Korean Grill House’s pen-and-paper system, reducing human errors, minimizing staff workload, and speeding up service delivery. By offering a self-service ordering solution and actionable analytics, it enhances customer satisfaction and empowers the restaurant to optimize its operations, demonstrating the practical application of our academic learning.
Getting Started
To run EasyGrill locally:
Clone the repository: git clone <repository-url>

Install dependencies: npm install

Set up environment variables (e.g., Supabase URL and API key) in a .env.local file.

Run the development server: npm run dev

Access the app at http://localhost:3000.

To deploy on Vercel:
Link your repository to Vercel via the dashboard.

Configure environment variables in the Vercel project settings.

Deploy the app with a single click, and Vercel will handle the rest.

For detailed setup instructions and deployment steps, refer to the User’s Guide (#appendix-t-users-guide) in the documentation.
Future Enhancements
Future iterations could include:
Offline functionality for resilience against internet disruptions.

Integration with payment gateways for electronic transactions.

Inventory management features to track stock levels in real-time.

Note
This project was created solely for academic purposes as part of our capstone requirement at the Polytechnic University of the Philippines – Santa Maria Campus. It showcases our skills in web development, database management, and real-time system design while addressing real-world challenges faced by small-scale restaurants like SeoulMeat Korean Grill House.

