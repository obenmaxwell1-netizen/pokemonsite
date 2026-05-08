This is a perfect starting point. By keeping the first version focused on the **Product Catalog** and the **Manual Email Inquiry** system, you can launch quickly and handle the logistics yourself before adding more complex features later.

Here is a detailed **Project Scope Document** you can hand directly to **Antigravity**.

---

# Project Scope: TCG E-Commerce Store (Phase 1)

## 1. Project Overview
A high-end TCG storefront (similar to *Pokeclover.com*) specializing in international Pokémon and One Piece cards. The site will feature a professional catalog but will use a **Manual Inquiry System** via email instead of an automated checkout.

## 2. Technical Stack
*   **Frontend:** [Next.js / React] (To be confirmed by Antigravity)
*   **Backend/Database:** **Supabase**
*   **Security:** **Automatic RLS** enabled on all `public` schema tables.
*   **Storage:** Supabase Storage (for high-res product images).

## 3. Core Features & User Flow

### A. User Authentication
*   Users must be able to sign up/log in to create a profile.
*   Logged-in users should have a "My Inquiries" page to see a history of what they have requested in the past.

### B. Product Catalog
*   **Categories:** Support for Japanese, Korean, and Chinese Pokémon/One Piece sets.
*   **Filters:** Users can filter by Game (Pokémon/One Piece), Region (Japan/Korea), and Product Type (Booster Box, Packs, Singles).
*   **Product Pages:** Each product displays a gallery of images, price, description, and "Stock Status" (In Stock / Sold Out).

### C. The "Shopping List" & Inquiry Flow
*   **Cart:** Users add items to a cart.
*   **No Shipping Calculation:** No shipping costs are added at this stage.
*   **Payment Selection:** At the checkout screen, the user selects a "Preferred Payment Method" from a dropdown (e.g., Bank Transfer, Crypto, etc.).
*   **The "Final Action":** When the user clicks "Send Inquiry," the system:
    1.  Creates a record in the Supabase `orders` table.
    2.  Triggers a `mailto:` redirect that opens the user's default email app.
    3.  **Default Email Content:** The email body must automatically list the User's Name, the Items in the Cart, the Total Price, and the chosen Payment Method.

## 4. Admin Dashboard Requirements
The Admin (you) must be able to manage the entire store via a secure dashboard:
*   **Product Management:** 
    *   Upload/delete multiple images per product.
    *   Edit product titles, descriptions, and categories.
    *   Update prices in real-time.
*   **Inventory Control:** Manually toggle stock levels or mark items as "Sold Out."
*   **Order Tracking:** View all "Pending Inquiries" submitted by users to keep track of conversations.

## 5. Database Schema Requirements (for Supabase)
Antigravity should set up the following tables with **Row Level Security (RLS)**:
*   `profiles`: User-specific data.
*   `products`: ID, name, desc, price, category, stock_status, images (array).
*   `orders`: Linking user IDs to the list of products requested.

---

### 3 Final Questions to ensure this is 100% ready for them:

1.  **The "Default Message":** When the email app opens, what is the **exact email address** you want the inquiries sent to? 
2.  **Product Images:** Do you want the ability to add **videos** of the products (like a 360-degree view) later, or just strictly high-quality photos for now?
3.  **Payment Methods:** Can you list 3 or 4 specific payment methods you want to show in that dropdown menu? (e.g. 1. Bank Transfer, 2. PayPal, 3. Crypto).

