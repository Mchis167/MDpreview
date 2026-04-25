/**
 * High-Fidelity Sync Unit Test for MDpreview
 * Focuses on extreme scenarios for Selection & Click synchronization.
 */

(async function() {
  const results = [];
  const assert = (condition, message) => {
    results.push({ success: !!condition, message });
    console.log(`[SYNC-TEST] ${condition ? '✅' : '❌'} ${message}`);
  };

  console.log('--- Starting Sync Fidelity Tests ---');

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Mock Editor State
  const mockMarkdown = `
# Title
Line 2
Line 3
## **Section 1: Special Characters (Parentheses)**
This is a test with (inventory) and [links](https://google.com).
Wait, **Bold Text** is here.
More content...

## Section 2: Duplicate Content
Item A: Target 1
Item B: Something else
Item A: Target 1

## Section 3: Large Drift Gap
${'\n'.repeat(50)}
Target Line far away
`;

  try {
    // PREPARE: Inject content into Editor and Read View
    if (typeof EditorModule !== 'undefined') {
       const textarea = document.getElementById('edit-textarea');
       if (textarea) {
         textarea.value = mockMarkdown;
       }
    }
    const mdContent = document.getElementById('md-content');
    if (mdContent) {
      mdContent.style.display = 'block'; // CRITICAL: Must be visible to measure rects
      mdContent.innerHTML = `
        <div data-line="1" style="height: 500px; display: block;">Title</div>
        <div data-line="5" style="height: 500px; display: block;">Section 1</div>
        <div data-line="60" style="height: 500px; display: block;">Target Line</div>
      `;
    }

    // TEST 1: Fuzzy Match with Markdown Syntax (Stars/Hashes)
    console.log('Running Test 1: Markdown Syntax Matching...');
    const syncData1 = {
      line: 5,
      selectionText: "Section 1: Special Characters (Parentheses)",
      offset: 0
    };
    if (typeof EditorModule !== 'undefined') {
      EditorModule.focusWithContext(syncData1);
      const textarea = document.getElementById('edit-textarea');
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      // Check if we found the text and it's inside the expected header
      const contextBefore = textarea.value.substring(textarea.selectionStart - 10, textarea.selectionStart);
      assert(sel.includes("Section 1") && contextBefore.includes("##"), 
        "Matched header correctly despite Markdown bold/header syntax.");
    }

    // TEST 2: Multi-word Drift Match
    console.log('Running Test 2: Drift Match (Renderer line 500 -> Actual line 60)...');
    const syncData2 = {
      line: 500, // Massive drift
      selectionText: "Target Line far away",
      offset: 0
    };
    if (typeof EditorModule !== 'undefined') {
      EditorModule.focusWithContext(syncData2);
      const textarea = document.getElementById('edit-textarea');
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      assert(sel === "Target Line far away", "Found target text despite 400+ line drift.");
    }

    // TEST 3: Duplicate Content Logic
    // Should prioritize the one near the line number
    console.log('Running Test 3: Duplicate Content Ambiguity...');
    const syncData3 = {
      line: 13, // Near the second "Item A: Target 1"
      selectionText: "Item A: Target 1"
    };
    if (typeof EditorModule !== 'undefined') {
      EditorModule.focusWithContext(syncData3);
      const textarea = document.getElementById('edit-textarea');
      // Line 13 is near the end
      assert(textarea.selectionStart > mockMarkdown.length / 2, "Found the correct instance of duplicate text based on line proximity.");
    }

    // TEST 4: Click Sync (Context Anchor)
    console.log('Running Test 4: Edit-to-Read Context Anchor...');
    const barInstance = (typeof ChangeActionViewBar !== 'undefined' && ChangeActionViewBar.getInstance) 
      ? ChangeActionViewBar.getInstance() 
      : null;

    if (barInstance) {
       // Mock a cursor position in Editor at "Bold Text"
       const textarea = document.getElementById('edit-textarea');
       const pos = mockMarkdown.indexOf('Bold Text');
       textarea.setSelectionRange(pos, pos); // No selection, just cursor
       
       const syncData = barInstance.captureEditorSyncData();
       assert(syncData.selectionText === "Wait, Bold Text is here.", "Captured line context correctly when no text is selected.");
    }

    // TEST 5: Real Selection Identification
    console.log('Running Test 5: Real Selection Verification...');
    if (barInstance) {
       const textarea = document.getElementById('edit-textarea');
       textarea.setSelectionRange(10, 20); // Select 10 characters
       const syncData = barInstance.captureEditorSyncData();
       assert(syncData.isRealSelection === true, "Correctly identified real text selection.");
    }

    // TEST 6: Cursor Only Identification
    console.log('Running Test 6: Cursor Only Verification...');
    if (barInstance) {
       const textarea = document.getElementById('edit-textarea');
       textarea.setSelectionRange(15, 15); // Cursor only
       const syncData = barInstance.captureEditorSyncData();
       assert(syncData.isRealSelection === false, "Correctly identified cursor-only (no selection).");
    }

    // TEST 7: Scroll-only Fallback (No selection, No click)
    console.log('Running Test 7: Scroll-only Fallback Verification...');
    if (barInstance) {
       // Reset state
       barInstance.lastClickedLine = null;
       window.getSelection().removeAllRanges();
       
       const syncData = barInstance.captureReadViewSyncData();
       // It should return the line number of the first visible element in the viewer
       assert(syncData.line > 0, `Correctly fell back to top visible line: ${syncData.line}`);
    }

    console.log('--- Sync Fidelity Tests Completed ---');
    console.table(results);

  } catch (err) {
    console.error('Test Suite Failed:', err);
  }
})();
