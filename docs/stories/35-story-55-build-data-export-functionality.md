### Story 5.5: Build Data Export Functionality

**As a** user who wants to track my data externally,
**I want** to export my training data in CSV or JSON format,
**So that** I can analyze it in spreadsheets or back it up.

**Acceptance Criteria:**

**Given** insights engine is operational (Story 5.4 complete)
**When** I navigate to `/progress` route and scroll to the bottom
**Then** the Data Export section provides export options:

**Export Functionality:**

* Two export format buttons:
  * "Export as CSV" (for spreadsheet apps like Excel/Sheets)
  * "Export as JSON" (for technical users/backups)
* Date range selector (optional):
  * "Last 7 days", "Last 30 days", "Last 90 days", "All time" (default)
* Export includes:
  * All sessions in selected date range
  * All drill results for those sessions
  * Assessment results (if any)
  * User settings and streak data

**CSV Format:**

```csv
Session ID,Date,Time,Module,Duration,Drill Count,Accuracy,Confidence Before,Confidence After,Confidence Change
uuid-123,2025-11-09,14:30,training,647000,12,85,2,4,2
...

Drill ID,Session ID,Timestamp,Module,Target,User Answer,Correct Answer,Accuracy,Time
uuid-456,uuid-123,1699545600000,number_line,47,45,47,95.7,3247
...
```

**JSON Format:**

```json
{
  "exportDate": "2025-11-09T14:30:00Z",
  "dateRange": "all_time",
  "sessions": [...],
  "drillResults": [...],
  "assessments": [...],
  "userSettings": {...},
  "streak": 5
}
```

**Export Trigger:**

* Click export button → Generates file immediately (no server call)
* Browser download triggered with filename: `discalculas-export-2025-11-09.csv`
* Toast notification: "Export complete! Check your downloads."

**And** Data privacy notice:

* Text above export buttons: "Your data stays on your device. Exports are created locally."
* Reassures users about privacy (no data sent to server)

**And** Export validation:

* If no data to export: Disable export buttons, show message "No data to export yet"
* If date range selected has no data: Show toast "No sessions found in selected date range"

**Prerequisites:** Story 5.4 (Insights engine complete, full data model available)

**Technical Notes:**

* Location: `src/features/progress/components/DataExport.tsx`
* CSV generation: Use `papaparse` library or custom CSV serializer
  * Function: `generateCSV(sessions, drillResults) => string`
* JSON generation: `JSON.stringify(exportData, null, 2)`
* File download: Create Blob, trigger download via `<a download>` element
* Example:
  ```typescript
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `discalculas-export-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ```
* Export service: `src/services/storage/exportData.ts` (started in Epic 3, expand here)
* Test: Verify exported file contains correct data, proper formatting

***
