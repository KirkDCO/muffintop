# MuffinTop Feature Roadmap

Potential future features organized by complexity and category.

---

## Quick Wins (Low Complexity)

### 1. Copy Meals Between Days
Allow users to copy all meals from one day to another - great for meal prep or consistent eating patterns.
- Add "Copy to today" button on historical days
- Add "Copy from..." option when viewing a date
- Files: Dashboard.tsx, food-log-service.ts

### 2. Favorite Foods
Star frequently used foods for quick access (separate from automatic "recent" list).
- Add heart/star icon to foods in search and log
- New "Favorites" section in Quick Add
- Files: New favorites table, FoodSearch.tsx, RecentFoods.tsx

### 3. Daily Notes/Journal
Add a simple text field to each day for notes about how you felt, meal quality, etc.
- Add notes field to activity_log or new daily_notes table
- Display below activity input
- Useful for correlating feelings with nutrition

### 4. Streak Tracking
Show how many consecutive days the user has logged food.
- Calculate from food_log data
- Display badge on dashboard
- Motivational feature

### 5. Recipe Scaling
Scale recipe servings up or down with auto-adjusted ingredient quantities.
- Add serving multiplier to RecipeDetail
- Recalculate displayed nutrients
- Useful for cooking larger/smaller batches

---

## Medium Complexity

### 6. Weekly/Monthly Reports
Generate summary reports showing:
- Average daily intake per nutrient
- Days on/over/under target
- Weight change over period
- Most logged foods
- Files: New ReportsPage, stats-service expansion

### 7. Meal Templates
Save common meal combinations (e.g., "My usual breakfast") for one-click logging.
- New meal_template table
- Template builder UI
- Apply template to current day

### 8. Water/Hydration Tracking
Track daily water intake with goal setting.
- New hydration_log table
- Quick-add water buttons (8oz, 16oz, custom)
- Daily progress indicator
- Show on dashboard

### 9. Nutrient Alerts
Warn when approaching or exceeding limits:
- "You've consumed 90% of your daily sodium"
- Configurable per nutrient
- Non-intrusive notifications

### 10. Data Export
Export food log and weight data to CSV/JSON.
- Export page in Settings
- Date range selection
- Multiple format options
- Useful for doctor visits or external analysis

### 11. Supplement Tracking
Log vitamins and supplements separately from food.
- New supplement table
- Quick logging (daily checkbox style)
- Show supplement nutrients in daily totals (optional)

---

## Higher Complexity

### 12. Barcode Scanning
Scan food barcodes for quick logging.
- Integrate with Open Food Facts API (free)
- Camera access for barcode scanning
- Map to USDA foods or create custom food
- Mobile-first feature

### 13. Photo Meal Logging with AI
Take a photo of your meal, AI estimates nutrients.
- Integration with vision API
- Suggest matching foods from database
- Review and confirm before logging
- Files: New PhotoLog component, backend AI service

### 14. Intermittent Fasting Timer
Track eating windows for IF protocols.
- Start/stop eating window
- Show current fast duration
- Historical fasting log
- Common IF presets (16:8, 18:6, OMAD)

### 15. Fitness Tracker Integration
Sync activity calories from external sources.
- OAuth with Strava, Garmin, Apple Health
- Auto-populate activity calories
- Sync weight data bidirectionally

### 16. Macro/Goal Calculator
Calculate recommended targets based on:
- Current weight, height, age, sex
- Activity level
- Goal (lose/maintain/gain)
- Output suggested calorie and macro targets

### 17. Food/Weight Correlations
Analyze and display correlations:
- "Higher protein intake correlates with weight loss"
- "Sodium tends to increase water weight next day"
- Requires statistical analysis on historical data

---

## Community/Social Features

### 18. Public Recipe Sharing
Share recipes publicly with a link.
- Generate shareable recipe URLs
- Import recipes from other users
- Optional: Recipe discovery feed

### 19. Recipe Comments/Ratings
Allow users to rate and comment on shared recipes.
- 5-star rating system
- Comment thread per recipe
- Filter by rating

---

## Recommended Priorities

Based on user value and implementation effort:

1. **Copy Meals Between Days** - Quick win, high daily utility
2. **Favorite Foods** - Simple to implement, speeds up logging
3. **Weekly Reports** - Provides motivation and insights
4. **Data Export** - Important for users who want their data
5. **Water Tracking** - Common feature users expect
6. **Barcode Scanning** - Game-changer for logging speed (if mobile use is common)
