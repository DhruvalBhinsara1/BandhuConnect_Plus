<<<<<<< Updated upstream
BandhuConnect+ Frontend Guidelines: React Native Hackathon MVP (Descriptive)This guideline provides a focused and detailed approach to building the frontend for yourBandhuConnect+ MVP within a 3-day hackathon timeframe using React Native. It prioritizescore functionality, rapid UI development, and essential user experience elements for all threeuser types: Volunteers, Admins, and Pilgrims/Attendees.1. Architectural Principles (MVP Focus)For the hackathon, our frontend architecture will prioritize rapid development and corefunctionality over full-scale optimization or every edge case.• Cross-Platform Development: Leverage React Native to build a single codebase that runson both iOS and Android. This significantly speeds up development by avoiding platformspecific code, making it ideal for a hackathon.• Component-Based Architecture: Utilize React Native's component-based nature to buildreusable UI elements (e.g., buttons, input fields, task cards, map views). This promotesmodularity and faster assembly of screens.• Intuitive User Experience (UX): Focus on clear, simple, and intuitive interfaces for eachuser role. A hackathon prototype needs to be immediately understandable. Minimizecomplex navigation or excessive settings.• Core Functionality First: Prioritize implementing the absolute essential features for eachuser type to demonstrate the application's value proposition. Visual polish and advancedfeatures can be added post-hackathon.2. Tech Stack & Tools (Leveraging React Native Ecosystem for MVP)We'll choose tools that enable rapid development and address key requirements for a mobileMVP.2.1. React Native with Expo• React Native: The primary framework for building native mobile apps usingJavaScript/TypeScript and React.• Expo: An open-source platform for making universal native apps with React. Itdramatically simplifies the development workflow (setup, local testing with Expo Go,build process) making it essential for a hackathon.o Usage: Use Expo CLI for project initialization and running the app.2.2. UI Libraries & Styling• Rapid UI Development: Avoid complex custom CSS setups. Use a utility-first CSSframework or a component library for speed.o use a styling approach like Tailwind CSS for React Native (e.g., with NativeWindor similar tools). This allows for quick, responsive styling directly in JSX.• Consistent Styling: Define a basic color palette and typography once, and reuse it acrossthe app for visual consistency.2.3. Mapping Library• react-native-maps: This library is the go-to for integrating maps into React Native apps.o Usage: We'll use it to display a map, add markers for locations (volunteer'scurrent, task/request), and potentially animate a marker for simulatedmovement.o Configuration: Be aware that it requires API keys (e.g., Google Maps API) andnative module setup, which Expo can simplify but still requires attention.2.4. State Management• React Context API / useState: For an MVP, React's built-in Context API combined withuseState and useReducer hooks is generally sufficient for managing application state.Avoid external state management libraries like Redux unless absolutely necessary andyour team is highly proficient, as they add setup overhead.• Supabase Client Integration: The Supabase client library (@supabase/supabase-js) willbe the primary tool for interacting with the backend (authentication, database queries,real-time subscriptions). This client library often works well with React Hooks.3. Core UI/UX Principles (Hackathon Focus)Design decisions should prioritize clarity and directness.• Mobile-First Design: Ensure the layout and interactivity are optimized for smalltouchscreens. Large, tappable areas and clear fonts are essential.• Clear Calls to Action (CTAs): Buttons and interactive elements should have unambiguouslabels (e.g., "Sign Up," "Check In," "Report Issue").• Minimalist Interface: Avoid clutter. Each screen should have a clear purpose. Onlydisplay essential information.• Loading States: Provide visual feedback (e.g., loading spinners) when data is beingfetched or an action is being processed, especially for map loading or API calls.4. Feature Implementation Guidelines (Per User Role - MVP)Here's how to approach the key features for each part of the app.4.1. Volunteer App Features• Sign-Up Page:o UI: Simple form with text inputs for Name, Email, Mobile No, Age.o Skills: Use checkboxes or a multi-select dropdown for Med, Tech, Logistics,Cleaning, General.o Data Privacy & Consent: A single checkbox "I agree to the terms" with basic text.o Backend Interaction: Use Supabase Auth to register the user and insert profiledetails (including skills, age) into the users table.• Dashboard:o Volunteer Display: Prominently show the volunteer's name at the top.o Task Display: A card or section showing a hardcoded/randomized task. Includedescription. If it's a "Lost Person" task, display a placeholder image for the photoand hardcoded Name, Age, Phone Number.o Duty Timings: Display a hardcoded duty schedule.o Map Display: Integrate react-native-maps. Show two markers: one for thesimulated volunteer's current location (can be a fixed point or a simple animatedpath for demo) and one for the hardcoded task location. The map should be theprimary visual element in this section.o Check-in-out: Two distinct buttons ("Check In," "Check Out"). Clicking themshould update the volunteer's status (e.g., in a status column in the users table orvolunteer\_tasks table) and visually reflect it (e.g., "On Duty," "Off Duty").• General Chatroom:o UI: A basic message list and an input field with a send button.o Backend Interaction: Use Supabase Realtime to subscribe to the general chatchannel and display new messages instantly. Use Supabase client to insert newmessages into the messages table.4.2. Admin Dashboard Features• Admin Dashboard:o UI: Display placeholder counts for "Active Volunteers," "Inactive Volunteers," and"Distinct Services." These can be hardcoded or fetched with simple Supabasequeries for a basic demo.• Request Panel:o UI: A list of requests (e.g., cards for each request). Each card should showRequest ID, User ID (pilgrim name if available), Type of Request, Service Activity.o Map: A separate screen or modal view that displays the request's location on amap (using react-native-maps) when a request is selected.o Backend Interaction: Use Supabase Realtime to listen for new requests. UseSupabase client to fetch request details and update their status.• Volunteer Panel:o UI: A list of volunteers. Each item shows Vol ID, Status, current Task (if any), Skills.o Manual Override (Simplified): For the hackathon, implement simple buttons ortoggles for "Change Status" and "Assign Task" (to a hardcoded task). The actualassignment logic can be basic and performed directly via Supabase clientupdates.4.3. Pilgrim/Attendee App Features• Sign-Up Page:o UI: Simple form for Name, Mobile No. Email can be optional.o Data Privacy & Consent: A mandatory checkbox for "I agree to the terms andprivacy policy."o Backend Interaction: Use Supabase Auth to register the user and insert basicprofile details into the users table.• Request Assistance:o UI: A form with a dropdown/radio buttons for "Type of Request."o Lost Child Field: If "Lost Child" is selected, dynamically show fields for PhotoUpload (using ImagePicker from Expo), Name, Age, Contact Phone Number.o Location: Display auto-detected GPS coordinates or a simple map view (usingreact-native-maps) to allow confirmation/manual adjustment.o Description: Text input for description. Voice recording is a stretch goal.o Backend Interaction: Insert the request into the requests table (including photoURL if uploaded).• Report Sanitation Issues:o UI: Similar to Request Assistance, with auto-detected location, Photo Upload,and a Description field.o Backend Interaction: Insert the report into the requests table.• View Volunteer Status:o UI: After submitting a request, display a screen showing "Volunteers on the Way"status.o Map Tracking: A dynamic map (using react-native-maps) showing the pilgrim'srequest location and a simulated moving marker for the assigned volunteer(s).• Language Selection:o UI: A dropdown or settings screen to select preferred language.o Implementation: For MVP, this might just change a local state variable anddisplay a message, or simply show the UI elements in a different hardcodedlanguage to demonstrate the feature. Full internationalization (i18n) is a posthackathon task.5. API Interaction (Supabase Integration for MVP)We'll primarily use the Supabase JavaScript client library.• Direct Supabase Client: All frontend code will interact directly with Supabase via itsclient library (@supabase/supabase-js). This client handles authentication, databasequeries, and real-time subscriptions, making it very efficient.• Local State Management: Fetch data from Supabase and store it in component-levelstate or React Context for display.• Error Handling: Implement basic error handling using try...catch blocks around Supabasecalls. Display user-friendly error messages (e.g., an alert or a small text message on thescreen) for any failures.6. Security & Data Handling (MVP Focus)• Client-Side Input Validation: Implement basic validation for forms (e.g., required fields,email format) to improve user experience before sending data to the backend.• Secure Environment Variables: Store your Supabase URL and anon key securely usingExpo's environment variable capabilities (e.g., expo-constants or .env files with a buildtool). Never hardcode these directly in your source code.• Image Handling: For photo uploads, use Expo's ImagePicker to select images andSupabase client's storage upload functions to send them to your Supabase Storagebucket. Ensure RLS policies on Storage are set up.7. Testing & Debugging (Hackathon Level)• Manual Testing: Thoroughly test all core user flows on an emulator/simulator and, ifpossible, on a physical device using Expo Go.• Expo Go: Utilize Expo Go for rapid iteration and debugging during development.• React Native Debugger: Use tools like React Native Debugger (which combines ReactDevTools and Redux DevTools) for inspecting component state and network requests.• Supabase Logs: Monitor logs in your Supabase dashboard for any backend errors orfunction execution issues.By adhering to these guidelines, your team can build a functional, demonstrable, and impressiveBandhuConnect+ MVP within the hackathon's 3-day window, effectively showcasing its corevalue proposition across all three user segments.
=======
# BandhuConnect+ Frontend Guidelines: React Native Hackathon MVP (Descriptive)

This guideline provides a focused and detailed approach to building the frontend for your BandhuConnect+ MVP within a 3-day hackathon timeframe using React Native with Expo SDK 53. It prioritizes core functionality, rapid UI development, essential user experience elements for all three user types: Volunteers, Admins, and Pilgrims/Attendees, and modern UI design principles.

## Architectural Principles (MVP Focus)

For the hackathon, our frontend architecture will prioritize rapid development and core functionality over full-scale optimization or every edge case.

- **Cross-Platform Development:** Leverage React Native (v0.71) built with Expo SDK 53 to create a single codebase that runs on iOS (iPhone), Android, and Web (via React Native Web). This significantly speeds up development without platform-specific code.
- **Component-Based Architecture:** Utilize React Native's component-based nature to build reusable UI elements (e.g., buttons, input fields, task cards, map views). This promotes modularity and faster assembly of screens.
- **Intuitive User Experience (UX):** Focus on clear, simple, and intuitive interfaces for each user role. A hackathon prototype needs to be immediately understandable. Minimize complex navigation or excessive settings.
- **Core Functionality First:** Prioritize implementing the absolute essential features for each user type to demonstrate the application's value proposition. Visual polish and advanced features can be added post-hackathon.
- **Modern UI Design:** Use vector icons (e.g., `react-native-vector-icons` or `@expo/vector-icons`) instead of emojis for all iconography, ensuring a professional and minimalist look.

## Tech Stack & Tools (Leveraging React Native Ecosystem for MVP)

We'll choose tools that enable rapid development and address key requirements for a mobile MVP:

### 2.1 React Native with Expo SDK 53

- Use React Native v0.71 with Expo SDK 53 to develop a universal app for iOS, Android, and Web.
- Develop with Expo CLI for project initialization and running the app.
- Use Expo Go for in-device testing on iOS and Android.
- Test web compatibility with React Native Web.

### 2.2 UI Libraries & Styling

- **Rapid UI Development:** Use utility-first CSS frameworks such as NativeWind (Tailwind CSS for React Native) for fast and maintainable styling directly in JSX.
- **Consistent Styling:** Define a basic color palette and typography once and reuse it for visual consistency.
- **Iconography:** Integrate vector icon libraries such as `@expo/vector-icons` or `react-native-vector-icons` for buttons, navigation, and other UI elements to maintain a modern aesthetic without emojis.

### 2.3 Mapping Library

- Use `react-native-maps` to display maps, add markers for location tracking (volunteer’s simulated current location, task/request location).
- Ensure configuration aligns with Expo SDK 53 managed workflow; provide the necessary API keys (e.g., Google Maps API).

### 2.4 State Management

- Use React Context API combined with React hooks (`useState`, `useReducer`) for state management.
- Avoid heavier external state libraries like Redux unless absolutely required.

### 2.5 Image Upload & Camera

- Use Expo ImagePicker for selecting images.
- Integrate Supabase Storage API for uploading images securely.

### 2.6 Environment Variables

- Secure sensitive information like Supabase URL and anon keys with Expo Constants or `.env` files.
- Avoid hardcoding any secrets in source code.

## Core UI/UX Principles (Hackathon Focus)

- **Mobile-First Design:** Optimize layouts and interactions for small touchscreen devices with large tappable areas and clear fonts.
- **Clear Calls to Action (CTAs):** Use unambiguous button labels (e.g., "Sign Up," "Check In," "Report Issue").
- **Minimalist Interface:** Avoid clutter; show only essential information per screen.
- **Loading States:** Provide visual feedback (loading spinners or skeletons) when fetching data or performing actions.

## Feature Implementation Guidelines (Per User Role - MVP)

### 4.1 Volunteer App Features

- Simple sign-up forms with relevant inputs.
- Dashboard showing volunteer info and assigned tasks.
- Map integrating react-native-maps with multiple markers.
- Check-In and Check-Out buttons updating volunteer status on the backend.
- General chatroom with real-time Supabase Realtime integration.

### 4.2 Admin Dashboard Features

- Placeholders for volunteer counts, services, etc.
- Request panel listing requests with map views.
- Volunteer panel with toggle buttons for assignments and status overrides.

### 4.3 Pilgrim/Attendee App Features

- Simple sign-up forms with consent checkbox.
- Request assistance and report sanitation forms, including photo upload.
- Map showing request and volunteer status.
- Language selection with local state switching (i18n post-hackathon).

## API Interaction (Supabase Integration for MVP)

- Direct use of `@supabase/supabase-js` client for authentication, CRUD, and realtime.
- Local component or React Context state for managing fetched data.
- Basic error handling with user-friendly UI messages.

## Security & Data Handling (MVP Focus)

- Client-side validation for required fields, email format, etc.
- Secure environment variable handling, no hardcoded secrets.
- Ensure RLS policies are setup on Supabase storage and database.

## Testing & Debugging (Hackathon Level)

- Manual testing on Expo Go for iOS and Android.
- Validate React Native Web build for browser testing.
- Use React Native Debugger for state and network inspection.
- Monitor Supabase backend logs.

---

By following these updated guidelines specific to Expo SDK 53 and modern React Native best practices, your team will produce a professional, scalable, and cross-platform BandhuConnect+ MVP efficiently within the hackathon timeline.
>>>>>>> Stashed changes
