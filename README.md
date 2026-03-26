# 🏠 HostelCare — Hostel Complaint Management System

A professional, fully responsive, web-based complaint management system for hostels. Students can submit complaints, track their status, and hostel wardens/admins can manage and resolve issues efficiently — **no login required**.

---

## ✅ Completed Features

### 🏠 Home Page
- Attractive hero section with navigation cards
- Live stats banner showing total, pending, in-progress, and resolved complaints
- Complaint categories guide (Electrical, Plumbing, Food, Cleanliness, Internet, etc.)
- Step-by-step "How It Works" section

### 📝 Student Module
- Complaint registration form with validation
- Fields: Student Name, Mobile, Room Number, Hostel Block, Complaint Type, Priority, Description
- **Image upload** with drag & drop support and preview
- Auto-generated unique Complaint ID (e.g., `CMP-2024-1234`)
- Success screen showing the generated ID after submission

### 🔍 Complaint Tracking
- Track complaint by entering Complaint ID
- Visual progress steps (Pending → Assigned → In Progress → Resolved)
- Shows assigned staff, warden remarks, and complaint details
- Sample IDs available for quick demo testing

### 🛡️ Warden Dashboard
- View all complaints with detailed table
- Filter complaints by Status and Type
- Live search across complaint data
- **Manage Modal** — update status, assign staff, add remarks
- View full complaint details in modal
- Maintenance staff directory with availability status

### 📊 Admin Dashboard
- Summary stats: Total, Pending, In Progress, Resolved, High Priority, Resolution Rate
- **4 Interactive Charts** using Chart.js:
  - Status Distribution (Donut Chart)
  - Complaint by Category (Bar Chart)
  - Priority Distribution (Pie Chart)
  - Monthly Trend (Line Chart)
- Complete complaint table with search & filter
- Staff management directory
- **Export to Excel** (generates `.xlsx` file using SheetJS with 2 sheets: All Complaints + Summary)

---

## 🔗 Entry Points (Pages)

| Page | Description |
|---|---|
| `/` (Home) | Landing page with navigation and stats |
| Click "Register Complaint" | Student complaint submission form |
| Click "Track Complaint" | Complaint status tracking by ID |
| Click "Warden Panel" | Warden complaint management dashboard |
| Click "Admin Dashboard" | Analytics, charts, and Excel export |

---

## 🗂️ Data Models

### `complaints` Table
| Field | Type | Description |
|---|---|---|
| id | text | System-generated UUID |
| complaint_id | text | Human-readable ID (CMP-YYYY-XXXX) |
| student_name | text | Student's full name |
| room_number | text | Room number |
| mobile_number | text | Contact number |
| hostel_block | text | Block name (A, B, C...) |
| complaint_type | text | Category of complaint |
| description | rich_text | Detailed description |
| image_url | text | Uploaded image URL |
| status | text | Pending / Assigned / In Progress / Resolved |
| assigned_staff | text | Staff name assigned |
| remarks | rich_text | Warden's remarks |
| priority | text | High / Medium / Low |

### `staff` Table
| Field | Type | Description |
|---|---|---|
| id | text | UUID |
| name | text | Staff name |
| role | text | Role (Electrician, Plumber...) |
| contact | text | Phone number |
| department | text | Department |
| available | bool | Availability status |

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| UI Library | Poppins Font, Font Awesome Icons |
| Charts | Chart.js 4.4 |
| Excel Export | SheetJS (xlsx) |
| Data Storage | RESTful Table API |
| Styling | Custom CSS with CSS Variables |

---

## 📦 Project Structure

```
index.html          ← Main application (all pages via SPA)
css/
  style.css         ← Complete stylesheet
js/
  app.js            ← All JavaScript logic
README.md           ← This file
```

---

## 🚀 Deployment

To deploy this website and make it live, go to the **Publish tab** to publish your project with one click.

---

## 🔮 Recommended Next Steps

1. Add an SMS/Email notification system for complaint status updates
2. Add rating/feedback system for resolved complaints
3. Add hostel warden authentication (optional)
4. Add complaint category-based auto-assignment of staff
5. Add PDF report generation alongside Excel export
6. Add complaint priority escalation system
7. Mobile app version using React Native / Flutter
