// List of collections with their Spreadsheet IDs, ranges, and icons
const collections = [
    { name: "Books", link: "https://docs.google.com/spreadsheets/d/1onJ-KYqWCYJVVbZZ31PLroHHquHSD0V9Jwl0RY6MPUk/edit?gid=1458534516#gid=1458534516", spreadsheetId: "1onJ-KYqWCYJVVbZZ31PLroHHquHSD0V9Jwl0RY6MPUk", range: "Books!A:Z", icon: "book-alt.png" },
    { 
        name: "Lego", 
        link: "https://docs.google.com/spreadsheets/d/1z4dUdJv5NEtIERnrU-6imW4OhuqRPC5Uyo1aituNkVA/edit?gid=0#gid=0", 
        spreadsheetId: "1z4dUdJv5NEtIERnrU-6imW4OhuqRPC5Uyo1aituNkVA", 
        ranges: [
            "SEALED!A:Z",
            "OPENED!A:Z"
        ],
        icon: "lego.png"
    },
    { 
        name: "Coins", 
        link: "https://docs.google.com/spreadsheets/d/1QxfAqU_8awBa2b0SmeJjFkFnQ59XGgpMGpgw_e-zyO4/edit?gid=1248804029#gid=1248804029", 
        spreadsheetId: "1QxfAqU_8awBa2b0SmeJjFkFnQ59XGgpMGpgw_e-zyO4", 
        ranges: [
            "Bullion!A:Z",
            "Numismatics!A:Z",
            "Just Coins!A:Z"
        ],
        icon: "coins.png"
    },
    { 
        name: "Games", 
        link: "https://docs.google.com/spreadsheets/d/1P17jeKvXtH34a6Su7MJkF09cAuAdByqUcIh2PwfB2uo/edit?gid=478900475#gid=478900475", 
        spreadsheetId: "1P17jeKvXtH34a6Su7MJkF09cAuAdByqUcIh2PwfB2uo", 
        ranges: [
            "RANDOM!A:Z",
            "CONSOLES!A:Z",
            "GB!A:Z",
            "GBC!A:Z",
            "GBA!A:Z",
            "PS1!A:Z",
            "PS2!A:Z",
            "PS3!A:Z",
            "PS4!A:Z",
            "XBOX!A:Z",
            "XBOX360!A:Z"
        ],
        icon: "console-controller.png"
    }
];

// Mapping of fields to display for each collection and tab
const displayFields = {
    "Books": {
        primaryField: "title",
        secondaryField: "author",
        tertiaryField: "publisher",
        quaternaryField: "edition",
        quinaryField: "printing/impression"
    },
    "Lego": {
        "SEALED": {
            primaryField: "name",
            secondaryField: "number"
        },
        "OPENED": {
            primaryField: "name",
            secondaryField: "number"
        }
    },
    "Coins": {
        "Bullion": {
            primaryField: "title",
            secondaryField: "year",
            countryField: "country"
        },
        "Numismatics": {
            primaryField: "title",
            secondaryField: "year",
            tertiaryField: "melt value",
            countryField: "country"
        },
        "Just Coins": {
            primaryField: "title",
            secondaryField: "year",
            tertiaryField: "composition",
            countryField: "country"
        }
    },
    "Games": {
        "RANDOM": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "CONSOLES": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "GB": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "GBC": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "GBA": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "PS1": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "PS2": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "PS3": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "PS4": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "XBOX": {
            primaryField: "product-name",
            secondaryField: "console-name"
        },
        "XBOX360": {
            primaryField: "product-name",
            secondaryField: "console-name"
        }
    }
};

// Object to store sheet data for each collection
let sheetData = {};

// Keep track of the current view and displayed items
let currentView = 'grid'; // Default to grid view
let currentItems = collections; // Default to collections list
let activeCollection = null; // Track the currently active collection (e.g., "Coins")

// Google Sheets API configuration
const API_KEY = 'AIzaSyAQKibD5tUuhpSDTjL67a4Z_pWgj0EcSTg';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Initialize the Google API Client (without OAuth)
function initClient() {
    gapi.load('client', () => {
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS
        }).then(() => {
            console.log("Google API Client initialized successfully.");
            fetchAllSheetData();
        }, (error) => {
            console.error("Error initializing Google API Client:", JSON.stringify(error, null, 2));
            console.error("Error details:", error.details);
            console.error("Error error:", error.error);
            alert("Failed to initialize Google API Client. Check the console for details.");
        });
    });
}

// Fetch data from all sheets and populate filter options
function fetchAllSheetData() {
    collections.forEach(collection => {
        // Skip collections with placeholder spreadsheet IDs
        if (collection.spreadsheetId.startsWith("your-")) {
            console.warn(`Skipping ${collection.name} due to placeholder spreadsheetId: ${collection.spreadsheetId}`);
            sheetData[collection.name] = []; // Set empty data to avoid breaking search
            return;
        }

        // Initialize the sheet data for this collection
        sheetData[collection.name] = [];

        // First, fetch the list of sheets (tabs) to get their gids
        console.log(`Fetching sheet metadata for ${collection.name} (Spreadsheet ID: ${collection.spreadsheetId})...`);
        gapi.client.sheets.spreadsheets.get({
            spreadsheetId: collection.spreadsheetId
        }).then(sheetResponse => {
            const sheets = sheetResponse.result.sheets;
            const sheetMap = {};
            sheets.forEach(sheet => {
                const sheetName = sheet.properties.title;
                const sheetId = sheet.properties.sheetId; // This is the gid
                sheetMap[sheetName] = sheetId;
            });

            console.log(`Sheet map for ${collection.name}:`, sheetMap);

            // Check if the collection has multiple ranges (tabs) or a single range
            if (collection.ranges) {
                // Handle multiple tabs
                let fetchPromises = collection.ranges.map(range => {
                    // Extract the sheet name from the range (e.g., "GBA!A:Z" -> "GBA")
                    const sheetName = range.split("!")[0];
                    console.log(`Fetching data for ${collection.name} (Spreadsheet ID: ${collection.spreadsheetId}, Range: ${range})...`);
                    return gapi.client.sheets.spreadsheets.values.get({
                        spreadsheetId: collection.spreadsheetId,
                        range: range
                    }).then(response => {
                        const values = response.result.values || [];
                        console.log(`Data fetched for ${collection.name} (Range: ${range}):`, values);
                        // Store the headers and data rows separately
                        const headers = values.length > 0 ? values[0] : [];
                        const dataRows = values.slice(1);
                        // Add the sheet name, gid, and headers to each row
                        return dataRows.map(row => ({
                            rowData: row,
                            sheetName: sheetName,
                            gid: sheetMap[sheetName] || 0,
                            headers: headers // Include the headers for this tab
                        }));
                    }, error => {
                        console.error(`Error fetching data for ${collection.name} (Range: ${range}):`, JSON.stringify(error, null, 2));
                        return []; // Return empty array on error to avoid breaking the Promise chain
                    });
                });

                // Wait for all fetches to complete, then combine the data
                Promise.all(fetchPromises).then(results => {
                    // Combine data from all tabs
                    let combinedData = [];
                    results.forEach(tabData => {
                        combinedData = combinedData.concat(tabData);
                    });

                    sheetData[collection.name] = combinedData;
                    console.log(`Combined data for ${collection.name}:`, sheetData[collection.name]);

                    // If this is the Coins collection, populate the country filter
                    if (collection.name === "Coins") {
                        populateCountryFilter(combinedData);
                    }

                    // Check if all collections have been processed
                    if (Object.keys(sheetData).length === collections.length) {
                        console.log("All sheet data fetched:", sheetData);
                        displayCollections(collections); // Display the collection buttons initially
                    }
                }).catch(error => {
                    console.error(`Error processing data for ${collection.name}:`, JSON.stringify(error, null, 2));
                    sheetData[collection.name] = [];
                    if (Object.keys(sheetData).length === collections.length) {
                        console.log("All sheet data fetched:", sheetData);
                        displayCollections(collections);
                    }
                });
            } else {
                // Handle single tab
                const sheetName = collection.range.split("!")[0];
                console.log(`Fetching data for ${collection.name} (Spreadsheet ID: ${collection.spreadsheetId}, Range: ${collection.range})...`);
                return gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: collection.spreadsheetId,
                    range: collection.range
                }).then(response => {
                    const values = response.result.values || [];
                    console.log(`Data fetched for ${collection.name} (Range: ${collection.range}):`, values);
                    const headers = values.length > 0 ? values[0] : [];
                    const dataRows = values.slice(1);
                    // Add the sheet name, gid, and headers to each row
                    const dataWithSheetInfo = dataRows.map(row => ({
                        rowData: row,
                        sheetName: sheetName,
                        gid: sheetMap[sheetName] || 0,
                        headers: headers
                    }));
                    sheetData[collection.name] = dataWithSheetInfo;
                    console.log(`Data fetched for ${collection.name}:`, sheetData[collection.name]);

                    // Check if all collections have been processed
                    if (Object.keys(sheetData).length === collections.length) {
                        console.log("All sheet data fetched:", sheetData);
                        displayCollections(collections); // Display the collection buttons initially
                    }
                }, error => {
                    console.error(`Error fetching data for ${collection.name} (Range: ${collection.range}):`, JSON.stringify(error, null, 2));
                    sheetData[collection.name] = []; // Set empty data to avoid breaking search
                    // Check if all collections have been processed
                    if (Object.keys(sheetData).length === collections.length) {
                        console.log("All sheet data fetched:", sheetData);
                        displayCollections(collections); // Display the collection buttons initially
                    }
                });
            }
        }, error => {
            console.error(`Error fetching sheet metadata for ${collection.name}:`, JSON.stringify(error, null, 2));
            sheetData[collection.name] = [];
            if (Object.keys(sheetData).length === collections.length) {
                console.log("All sheet data fetched:", sheetData);
                displayCollections(collections);
            }
        });
    });
}

// Function to populate the country filter dropdown for Coins
function populateCountryFilter(coinsData) {
    const countryFilter = document.getElementById("countryFilter");
    if (!countryFilter) {
        console.error("Country filter element not found!");
        return;
    }

    // Extract unique countries from the Coins data
    const countries = new Set();
    coinsData.forEach(rowEntry => {
        const headers = rowEntry.headers;
        const row = rowEntry.rowData;
        const sheetName = rowEntry.sheetName;

        // Find the index of the "country" column
        const countryIndex = headers.findIndex(header => header.toLowerCase() === "country");
        if (countryIndex !== -1 && row[countryIndex]) {
            countries.add(row[countryIndex]);
        }
    });

    // Sort countries alphabetically
    const sortedCountries = Array.from(countries).sort();

    // Populate the dropdown
    sortedCountries.forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });

    console.log("Populated country filter with:", sortedCountries);
}

// Function to show/hide the Coins filter based on the active collection or search results
function updateFilterVisibility(items) {
    const coinsFilter = document.getElementById("coinsFilter");
    if (!coinsFilter) {
        console.error("Coins filter element not found!");
        return;
    }

    // Show the filter if the active collection is "Coins" or if search results include Coins items
    if (activeCollection === "Coins" || (items.length > 0 && items.some(item => item.collectionName === "Coins"))) {
        coinsFilter.style.display = "block";
    } else {
        coinsFilter.style.display = "none";
    }
}

// Function to open the modal and display data
function openModal(data, type) {
    const modal = document.getElementById("sheetModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalTableContainer = document.getElementById("modalTableContainer");
    const modalTableHead = document.getElementById("modalTableHead");
    const modalTableBody = document.getElementById("modalTableBody");

    // Clear previous table content
    modalTableHead.innerHTML = "";
    modalTableBody.innerHTML = "";
    console.log("Cleared modalTableHead and modalTableBody");

    if (type === "collection") {
        // Set the active collection when opening a collection modal
        activeCollection = data;
        updateFilterVisibility(currentItems);

        // Display all data for a collection
        modalTitle.textContent = `${data} Data`;

        // Find the collection object to get the link
        const collection = collections.find(col => col.name === data);
        if (!collection) {
            console.error(`Collection ${data} not found in collections array`);
            return;
        }

        // Add a link to the original sheet
        const sheetLink = document.createElement("a");
        sheetLink.href = collection.link;
        sheetLink.textContent = "View in Google Sheets";
        sheetLink.classList.add("sheet-link");
        sheetLink.target = "_blank";
        modalTableBody.appendChild(sheetLink);
        console.log("Added sheetLink to modalTableBody for collection");

        // Get the data for this collection
        const collectionData = sheetData[data] || [];

        if (collectionData.length === 0) {
            modalTableBody.innerHTML += "<tr><td colspan='100'>No data available.</td></tr>";
            modal.style.display = "block";
            setTimeout(() => modal.classList.add("show"), 10);
            return;
        }

        // Since data may come from multiple tabs, group by sheetName
        const groupedData = {};
        collectionData.forEach(rowEntry => {
            const sheetName = rowEntry.sheetName;
            if (!groupedData[sheetName]) {
                groupedData[sheetName] = {
                    headers: rowEntry.headers,
                    rows: []
                };
            }
            groupedData[sheetName].rows.push(rowEntry.rowData);
        });

        // For single-tab collections (like Books), there will only be one sheet
        const sheetNames = Object.keys(groupedData);
        if (sheetNames.length === 1) {
            // Single tab: display the table directly
            const sheetName = sheetNames[0];
            const { headers, rows } = groupedData[sheetName];

            // Populate the table headers
            const headerRow = document.createElement("tr");
            headers.forEach(header => {
                const th = document.createElement("th");
                th.textContent = header || "N/A";
                headerRow.appendChild(th);
            });
            modalTableHead.appendChild(headerRow);

            // Populate the table rows
            rows.forEach(row => {
                const tr = document.createElement("tr");
                row.forEach(cell => {
                    const td = document.createElement("td");
                    td.textContent = cell || "";
                    tr.appendChild(td);
                });
                modalTableBody.appendChild(tr);
            });
        } else {
            // Multiple tabs: create a separate table for each tab
            sheetNames.forEach(sheetName => {
                const { headers, rows } = groupedData[sheetName];

                // Add a subheader for the tab
                const subheader = document.createElement("h3");
                subheader.textContent = `Tab: ${sheetName}`;
                subheader.style.color = "#e0e0e0";
                subheader.style.marginTop = "20px";
                modalTableBody.appendChild(subheader);

                // Create a new table for this tab
                const table = document.createElement("table");
                table.style.width = "100%";
                table.style.borderCollapse = "collapse";
                table.style.marginBottom = "20px";

                // Populate the table headers
                const thead = document.createElement("thead");
                const headerRow = document.createElement("tr");
                headers.forEach(header => {
                    const th = document.createElement("th");
                    th.textContent = header || "N/A";
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Populate the table rows
                const tbody = document.createElement("tbody");
                rows.forEach(row => {
                    const tr = document.createElement("tr");
                    row.forEach(cell => {
                        const td = document.createElement("td");
                        td.textContent = cell || "";
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);

                modalTableBody.appendChild(table);
            });

            // Apply the same styles to the dynamically created tables
            const tables = modalTableBody.querySelectorAll("table");
            tables.forEach(table => {
                table.querySelectorAll("th, td").forEach(cell => {
                    cell.style.padding = "10px";
                    cell.style.border = "1px solid #444";
                    cell.style.textAlign = "left";
                });
                table.querySelectorAll("th").forEach(th => {
                    th.style.backgroundColor = "#3a3a3a";
                    th.style.position = "sticky";
                    th.style.top = "0";
                    th.style.zIndex = "10";
                });
                table.querySelectorAll("tr:nth-child(even)").forEach(row => {
                    row.style.backgroundColor = "#333";
                });
                table.querySelectorAll("tr:hover").forEach(row => {
                    row.style.backgroundColor = "#444";
                });
            });
        }
    } else if (type === "item") {
        // Display details for a single search result item
        const { collectionName, sheetName, row, headers, spreadsheetId, gid } = data;

        // Debugging logs to inspect the data
        console.log(`Opening modal for item in ${collectionName} (${sheetName})`);
        console.log("Headers:", headers);
        console.log("Row data:", row);

        // Set the modal title
        modalTitle.textContent = `${collectionName} (${sheetName}) - Item Details`;
        console.log("Set modal title:", modalTitle.textContent);

        // Hide the table and show the item details container
        modalTableContainer.style.display = "none";
        const itemDetailsContainer = document.getElementById("itemDetailsContainer");
        itemDetailsContainer.style.display = "block";
        itemDetailsContainer.innerHTML = ""; // Clear previous content
        console.log("Hid modalTableContainer, showed itemDetailsContainer");

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("item-details");
        console.log("Created detailsDiv with class 'item-details'");

        // Add a link to the original sheet
        const sheetLink = document.createElement("a");
        sheetLink.href = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;
        sheetLink.textContent = "View in Google Sheets";
        sheetLink.classList.add("sheet-link");
        sheetLink.target = "_blank";
        detailsDiv.appendChild(sheetLink);
        console.log("Added sheetLink to detailsDiv");

        // Map headers to row data and display as key-value pairs
        let hasDetails = false;
        headers.forEach((header, index) => {
            // Ensure the value exists and handle undefined/null cases
            const value = row[index] !== undefined && row[index] !== null ? row[index].toString() : "N/A";
            console.log(`Header: ${header}, Value: ${value}`);
            if (header) { // Only display if the header is not empty
                const detailItem = document.createElement("div");
                detailItem.classList.add("detail-item");

                const label = document.createElement("span");
                label.classList.add("detail-label");
                label.textContent = `${header}:`;

                const detailValue = document.createElement("span");
                detailValue.classList.add("detail-value");
                detailValue.textContent = value;

                detailItem.appendChild(label);
                detailItem.appendChild(detailValue);
                detailsDiv.appendChild(detailItem);
                console.log(`Added detailItem for ${header}: ${value}`);
                hasDetails = true;
            }
        });

        // If no details are available
        if (!hasDetails) {
            detailsDiv.textContent = "No details available for this item.";
            console.log("No details available, set fallback message");
        }

        // Append the detailsDiv to itemDetailsContainer
        itemDetailsContainer.appendChild(detailsDiv);
        console.log("Appended detailsDiv to itemDetailsContainer");
        console.log("itemDetailsContainer content:", itemDetailsContainer.innerHTML);
    }

    // Show the modal with animation
    modal.style.display = "block";
    setTimeout(() => modal.classList.add("show"), 10);
    console.log("Displayed modal with animation");
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById("sheetModal");
    const modalTableContainer = document.getElementById("modalTableContainer");
    const modalTableBody = document.getElementById("modalTableBody");
    const itemDetailsContainer = document.getElementById("itemDetailsContainer");

    // Reset the active collection when closing the modal
    activeCollection = null;
    updateFilterVisibility(currentItems);

    // Fade out the modal
    modal.classList.remove("show");
    setTimeout(() => {
        // Reset the modal content after the animation
        modalTableContainer.style.display = "block";
        modalTableBody.innerHTML = "";
        itemDetailsContainer.style.display = "none";
        itemDetailsContainer.innerHTML = "";
        modal.style.display = "none";
    }, 300); // Match the transition duration (0.3s)
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById("sheetModal");
    if (event.target === modal) {
        closeModal();
    }
};

// Function to toggle between grid and list views
function toggleView(view) {
    const collectionGrid = document.getElementById("collectionGrid");

    // Update the current view
    currentView = view;

    // Update the classes on the collection grid
    if (view === 'grid') {
        collectionGrid.classList.remove('list-view');
        collectionGrid.classList.add('grid-view');
    } else {
        collectionGrid.classList.remove('grid-view');
        collectionGrid.classList.add('list-view');
    }

    // Re-render the current items in the new view
    displayCollections(currentItems);
}

// Function to display collections or search results
function displayCollections(items) {
    const collectionGrid = document.getElementById("collectionGrid");
    collectionGrid.innerHTML = ""; // Clear the grid

    // Store the current items being displayed
    currentItems = items;

    // Update filter visibility based on the displayed items
    updateFilterVisibility(items);

    // Ensure the correct view class is applied
    collectionGrid.classList.remove('grid-view', 'list-view');
    collectionGrid.classList.add(currentView + '-view');

    // Check if items is the collections array (initial display) or search results
    if (items.length > 0 && items[0].hasOwnProperty("name")) {
        // Initial display: show collection buttons
        items.forEach(collection => {
            const collectionItem = document.createElement("div");
            collectionItem.classList.add("collection-item");

            // Create a container for the icon and text
            const contentWrapper = document.createElement("div");
            contentWrapper.classList.add("collection-content");

            // Add the icon
            const icon = document.createElement("img");
            icon.src = collection.icon;
            icon.classList.add("collection-icon");
            icon.alt = `${collection.name} icon`;
            icon.onerror = () => console.error(`Failed to load icon for ${collection.name}: ${collection.icon}`); // Log if the icon fails to load
            contentWrapper.appendChild(icon);

            // Add the collection name
            const nameSpan = document.createElement("span");
            nameSpan.textContent = collection.name;
            contentWrapper.appendChild(nameSpan);

            collectionItem.appendChild(contentWrapper);

            // Add click event to open the modal with sheet data
            collectionItem.addEventListener("click", () => {
                openModal(collection.name, "collection");
            });

            collectionGrid.appendChild(collectionItem);
        });
    } else {
        // Search results: show matching rows
        if (items.length === 0) {
            // Display a "No results found" message if there are no matches
            const noResults = document.createElement("div");
            noResults.classList.add("no-results");
            noResults.textContent = "No results found.";
            collectionGrid.appendChild(noResults);
            return;
        }

        if (currentView === 'grid') {
            // Grid view: display as cards
            items.forEach(result => {
                const { collectionName, spreadsheetId, row, headers, sheetName, gid } = result;
                console.log(`Displaying result for ${collectionName} (${sheetName}):`, row);

                // Add debugging logs for Coins
                if (collectionName === "Coins") {
                    console.log(`Headers for ${sheetName}:`, headers);
                    console.log(`Row data for ${sheetName}:`, row);
                }

                // Map the row data to the headers to extract key fields
                const rowData = {};
                headers.forEach((header, index) => {
                    // Trim and normalize the header to handle spaces and case sensitivity
                    const normalizedHeader = header.trim().toLowerCase();
                    rowData[normalizedHeader] = row[index] || "";
                });

                // Add debugging log for rowData
                if (collectionName === "Coins") {
                    console.log(`Mapped rowData for ${sheetName}:`, rowData);
                }

                // Create a card for the search result
                const resultCard = document.createElement("div");
                resultCard.classList.add("result-card");

                // Display the collection name as a header with icon
                const collectionHeader = document.createElement("h3");
                const headerWrapper = document.createElement("div");
                headerWrapper.classList.add("collection-header");

                // Add the icon
                const collection = collections.find(col => col.name === collectionName);
                const icon = document.createElement("img");
                icon.src = collection.icon;
                icon.classList.add("collection-icon");
                icon.alt = `${collectionName} icon`;
                icon.onerror = () => console.error(`Failed to load icon for ${collectionName}: ${collection.icon}`); // Log if the icon fails to load
                headerWrapper.appendChild(icon);

                // Add the text
                const headerText = document.createElement("span");
                headerText.textContent = `From: ${collectionName} (${sheetName})`;
                headerWrapper.appendChild(headerText);

                collectionHeader.appendChild(headerWrapper);
                resultCard.appendChild(collectionHeader);

                // Get the fields to display based on the collection and tab
                let primaryField, secondaryField, tertiaryField, quaternaryField, quinaryField;
                let primaryLabel, secondaryLabel, tertiaryLabel, quaternaryLabel, quinaryLabel;
                if (displayFields[collectionName][sheetName]) {
                    // Collection with multiple tabs (Lego, Coins, Games)
                    primaryField = displayFields[collectionName][sheetName].primaryField;
                    secondaryField = displayFields[collectionName][sheetName].secondaryField;
                    tertiaryField = displayFields[collectionName][sheetName].tertiaryField || null;
                    quaternaryField = displayFields[collectionName][sheetName].quaternaryField || null;
                    quinaryField = displayFields[collectionName][sheetName].quinaryField || null;
                } else {
                    // Collection with a single tab (Books)
                    primaryField = displayFields[collectionName].primaryField;
                    secondaryField = displayFields[collectionName].secondaryField;
                    tertiaryField = displayFields[collectionName].tertiaryField || null;
                    quaternaryField = displayFields[collectionName].quaternaryField || null;
                    quinaryField = displayFields[collectionName].quinaryField || null;
                }

                // Safety check: Ensure primaryField and secondaryField are defined
                if (!primaryField || !secondaryField) {
                    console.error(`Missing primaryField or secondaryField for ${collectionName} (${sheetName})`);
                    return; // Skip this result to prevent errors
                }

                // Set user-friendly labels for the fields
                if (collectionName === "Books") {
                    primaryLabel = "Title";
                    secondaryLabel = "Author";
                    if (tertiaryField) {
                        tertiaryLabel = "Publisher";
                    }
                    if (quaternaryField) {
                        quaternaryLabel = "Edition";
                    }
                    if (quinaryField) {
                        quinaryLabel = "Printing/Impression";
                    }
                } else if (collectionName === "Lego") {
                    primaryLabel = "Set Name";
                    secondaryLabel = "Set Number";
                } else if (collectionName === "Coins") {
                    primaryLabel = "Coin Title";
                    secondaryLabel = "Year";
                    if (sheetName === "Numismatics" && tertiaryField) {
                        tertiaryLabel = "Melt Value";
                    } else if (sheetName === "Just Coins" && tertiaryField) {
                        tertiaryLabel = "Composition";
                    }
                } else if (collectionName === "Games") {
                    primaryLabel = "Game Name";
                    secondaryLabel = "Console";
                }

                // Display the fields
                const details = document.createElement("div");
                details.classList.add("result-details");

                const primary = document.createElement("p");
                primary.textContent = `${primaryLabel}: ${rowData[primaryField] || "N/A"}`;
                details.appendChild(primary);

                const secondary = document.createElement("p");
                secondary.textContent = `${secondaryLabel}: ${rowData[secondaryField] || "N/A"}`;
                details.appendChild(secondary);

                // Display the tertiary field if it exists
                if (tertiaryField && tertiaryLabel) {
                    const tertiary = document.createElement("p");
                    tertiary.textContent = `${tertiaryLabel}: ${rowData[tertiaryField] || "N/A"}`;
                    details.appendChild(tertiary);
                }

                // Display the quaternary field (Edition) if it exists
                if (quaternaryField && quaternaryLabel) {
                    const quaternary = document.createElement("p");
                    quaternary.textContent = `${quaternaryLabel}: ${rowData[quaternaryField] || "N/A"}`;
                    details.appendChild(quaternary);
                }

                // Display the quinary field (Printing/Impression) if it exists
                if (quinaryField && quinaryLabel) {
                    const quinary = document.createElement("p");
                    quinary.textContent = `${quinaryLabel}: ${rowData[quinaryField] || "N/A"}`;
                    details.appendChild(quinary);
                }

                resultCard.appendChild(details);

                // Add click event to open the modal with the item's details
                resultCard.addEventListener("click", () => {
                    openModal(result, "item");
                });

                collectionGrid.appendChild(resultCard);
            });
        } else {
            // List view: display as a table
            // Create a table to hold the search results
            const table = document.createElement("table");
            table.classList.add("search-results-table");

            // Create the table header
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            // Define the columns for the table
            const columns = [
                { label: "Collection", key: "collection" },
                { label: "Tab", key: "sheetName" },
                { label: "Primary", key: "primary" },
                { label: "Secondary", key: "secondary" },
                { label: "Tertiary", key: "tertiary" },
                { label: "Quaternary", key: "quaternary" },
                { label: "Quinary", key: "quinary" }
            ];

            columns.forEach(column => {
                const th = document.createElement("th");
                th.textContent = column.label;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create the table body
            const tbody = document.createElement("tbody");

            items.forEach(result => {
                const { collectionName, spreadsheetId, row, headers, sheetName, gid } = result;

                // Map the row data to the headers to extract key fields
                const rowData = {};
                headers.forEach((header, index) => {
                    const normalizedHeader = header.trim().toLowerCase();
                    rowData[normalizedHeader] = row[index] || "";
                });

                // Get the fields to display based on the collection and tab
                let primaryField, secondaryField, tertiaryField, quaternaryField, quinaryField;
                let primaryLabel, secondaryLabel, tertiaryLabel, quaternaryLabel, quinaryLabel;
                if (displayFields[collectionName][sheetName]) {
                    primaryField = displayFields[collectionName][sheetName].primaryField;
                    secondaryField = displayFields[collectionName][sheetName].secondaryField;
                    tertiaryField = displayFields[collectionName][sheetName].tertiaryField || null;
                    quaternaryField = displayFields[collectionName][sheetName].quaternaryField || null;
                    quinaryField = displayFields[collectionName][sheetName].quinaryField || null;
                } else {
                    primaryField = displayFields[collectionName].primaryField;
                    secondaryField = displayFields[collectionName].secondaryField;
                    tertiaryField = displayFields[collectionName].tertiaryField || null;
                    quaternaryField = displayFields[collectionName].quaternaryField || null;
                    quinaryField = displayFields[collectionName].quinaryField || null;
                }

                // Safety check: Ensure primaryField and secondaryField are defined
                if (!primaryField || !secondaryField) {
                    console.error(`Missing primaryField or secondaryField for ${collectionName} (${sheetName})`);
                    return; // Skip this result to prevent errors
                }

                // Set user-friendly labels for the fields
                if (collectionName === "Books") {
                    primaryLabel = "Title";
                    secondaryLabel = "Author";
                    if (tertiaryField) {
                        tertiaryLabel = "Publisher";
                    }
                    if (quaternaryField) {
                        quaternaryLabel = "Edition";
                    }
                    if (quinaryField) {
                        quinaryLabel = "Printing/Impression";
                    }
                } else if (collectionName === "Lego") {
                    primaryLabel = "Set Name";
                    secondaryLabel = "Set Number";
                } else if (collectionName === "Coins") {
                    primaryLabel = "Coin Title";
                    secondaryLabel = "Year";
                    if (sheetName === "Numismatics" && tertiaryField) {
                        tertiaryLabel = "Melt Value";
                    } else if (sheetName === "Just Coins" && tertiaryField) {
                        tertiaryLabel = "Composition";
                    }
                } else if (collectionName === "Games") {
                    primaryLabel = "Game Name";
                    secondaryLabel = "Console";
                }

                // Create a row for this search result
                const tr = document.createElement("tr");
                tr.classList.add("search-result-row");

                // Populate the row with data
                columns.forEach(column => {
                    const td = document.createElement("td");
                    if (column.key === "collection") {
                        // Add the icon and collection name
                        const contentWrapper = document.createElement("div");
                        contentWrapper.classList.add("collection-content");

                        const collection = collections.find(col => col.name === collectionName);
                        const icon = document.createElement("img");
                        icon.src = collection.icon;
                        icon.classList.add("collection-icon");
                        icon.alt = `${collectionName} icon`;
                        icon.onerror = () => console.error(`Failed to load icon for ${collectionName}: ${collection.icon}`); // Log if the icon fails to load
                        contentWrapper.appendChild(icon);

                        const nameSpan = document.createElement("span");
                        nameSpan.textContent = collectionName;
                        contentWrapper.appendChild(nameSpan);

                        td.appendChild(contentWrapper);
                    } else {
                        switch (column.key) {
                            case "sheetName":
                                td.textContent = sheetName;
                                break;
                            case "primary":
                                td.textContent = rowData[primaryField] || "N/A";
                                break;
                            case "secondary":
                                td.textContent = rowData[secondaryField] || "N/A";
                                break;
                            case "tertiary":
                                td.textContent = tertiaryField && rowData[tertiaryField] ? rowData[tertiaryField] : "N/A";
                                break;
                            case "quaternary":
                                td.textContent = quaternaryField && rowData[quaternaryField] ? rowData[quaternaryField] : "N/A";
                                break;
                            case "quinary":
                                td.textContent = quinaryField && rowData[quinaryField] ? rowData[quinaryField] : "N/A";
                                break;
                        }
                    }
                    tr.appendChild(td);
                });

                // Add click event to open the modal with the item's details
                tr.addEventListener("click", () => {
                    openModal(result, "item");
                });

                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            collectionGrid.appendChild(table);
        }
    }
}

// Function to search collections and collect matching rows with filters for Coins
function searchCollections() {
    const searchBar = document.getElementById("searchBar");
    const searchText = searchBar.value.toLowerCase();

    // Get filter values for Coins
    const tabFilter = document.getElementById("tabFilter")?.value || "all";
    const countryFilter = document.getElementById("countryFilter")?.value || "all";
    const yearFrom = document.getElementById("yearFrom")?.value || "";
    const yearTo = document.getElementById("yearTo")?.value || "";

    console.log(`Searching for: ${searchText}`);
    console.log(`Filters - Tab: ${tabFilter}, Country: ${countryFilter}, Year Range: ${yearFrom} - ${yearTo}`);

    // Array to store search results (matching rows)
    const searchResults = [];

    collections.forEach(collection => {
        // Search in the collection name
        const matchesName = collection.name.toLowerCase().includes(searchText);
        console.log(`Checking ${collection.name} - Matches name: ${matchesName}`);

        // Search in the sheet data
        const data = sheetData[collection.name] || [];
        const matchingRows = [];

        // Search in the data rows (each row now includes its own headers)
        data.forEach((rowEntry, rowIndex) => {
            const row = rowEntry.rowData; // Extract the actual row data
            if (!row) {
                console.warn(`Row data missing for ${collection.name} at index ${rowIndex}:`, rowEntry);
                return;
            }

            // Check if the row matches the search text
            const matchesRow = row.some(cell =>
                cell && cell.toString().toLowerCase().includes(searchText)
            );

            if (matchesRow) {
                // Apply filters for Coins
                if (collection.name === "Coins") {
                    const headers = rowEntry.headers;
                    const sheetName = rowEntry.sheetName;

                    // Map the row data to headers
                    const rowData = {};
                    headers.forEach((header, index) => {
                        const normalizedHeader = header.trim().toLowerCase();
                        rowData[normalizedHeader] = row[index] || "";
                    });

                    // Filter by tab
                    if (tabFilter !== "all" && sheetName !== tabFilter) {
                        return; // Skip this row if it doesn't match the selected tab
                    }

                    // Filter by country
                    if (countryFilter !== "all" && rowData["country"] !== countryFilter) {
                        return; // Skip this row if it doesn't match the selected country
                    }

                    // Filter by year range
                    const year = parseInt(rowData["year"], 10);
                    if (yearFrom && year < parseInt(yearFrom, 10)) {
                        return; // Skip if year is before the "from" year
                    }
                    if (yearTo && year > parseInt(yearTo, 10)) {
                        return; // Skip if year is after the "to" year
                    }
                }

                // Add the matching row to the results
                matchingRows.push({
                    collectionName: collection.name,
                    spreadsheetId: collection.spreadsheetId,
                    row: row,
                    headers: rowEntry.headers,
                    sheetName: rowEntry.sheetName,
                    gid: rowEntry.gid
                });
            }
        });

        console.log(`Checking ${collection.name} - Matching rows:`, matchingRows);

        // If the collection name matches or there are matching rows, add to search results
        if (matchesName || matchingRows.length > 0) {
            searchResults.push(...matchingRows);
        }
    });

    console.log("Search results:", searchResults);
    displayCollections(searchResults);
}

// Add event listener for the search bar
document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("searchBar");
    if (searchBar) {
        searchBar.addEventListener("input", searchCollections);
    } else {
        console.error("Search bar element not found!");
    }

    // Set the initial view class
    const collectionGrid = document.getElementById("collectionGrid");
    collectionGrid.classList.add(currentView + '-view');
});

// Start the process
initClient();