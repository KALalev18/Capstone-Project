document.addEventListener('DOMContentLoaded', function () {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let commitEvents = []; // Will store all commit events
    let firstCommitMonth;
    let firstCommitYear;

    // Add these variables for date range selection
    let startDate = null;
    let endDate = null;
    let isSelectingRange = false;

    // Add these variables to store commit months information
    let currentContributor = "all";
    let commitMonthsArray = [];

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Function to extract commit dates from allCommits for a specific contributor
    // If contributor is "all", include all commits
    function getCommitDates(contributor = "all") {
        // Make sure allCommits exists (from db_commit.js)
        if (!window.allCommits || !Array.isArray(window.allCommits)) {
            console.error('No commit data available to update calendar');
            return [];
        }

        // Filter commits based on contributor
        const filteredCommits = window.allCommits.filter(commit => {
            if (contributor === "all") {
                return true; // Include all commits
            } else if (commit.author && commit.author.login) {
                return commit.author.login === contributor;
            }
            return false;
        });

        // Extract dates from commits and create event objects
        return filteredCommits.map(commit => {
            const commitDate = new Date(commit.commit.author.date);
            return {
                date: commitDate,
                contributor: commit.author ? commit.author.login : 'unknown'
            };
        });
    }

    // Function to get all months that have commits and sort them chronologically
    function getCommitMonthsArray(contributor = "all") {
        const events = getCommitDates(contributor);
        
        // Create a Set of year-month combinations that have commits
        const monthsSet = new Set();
        
        events.forEach(event => {
            const year = event.date.getFullYear();
            const month = event.date.getMonth();
            monthsSet.add(`${year}-${month}`);
        });
        
        // Convert to array and sort chronologically
        const monthsArray = Array.from(monthsSet).map(key => {
            const [year, month] = key.split('-').map(Number);
            return { year, month };
        });
        
        monthsArray.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
        
        return monthsArray;
    }

    // Find the index of the current month in the commits array
    function findCurrentMonthIndex(commitsArray) {
        return commitsArray.findIndex(item => 
            item.year === currentYear && item.month === currentMonth);
    }

    // Rename function to better reflect its purpose and change its implementation
    function setCalendarToLastCommitDate() {
        if (commitEvents.length === 0) return;
        
        // Find the latest commit date instead of earliest
        const lastCommitDate = new Date(Math.max(...commitEvents.map(event => event.date.getTime())));
        
        // Set the calendar to that month/year
        currentMonth = lastCommitDate.getMonth();
        currentYear = lastCommitDate.getFullYear();
        
        // We still need to store the first commit date for backward navigation restriction
        // Find the earliest commit date
        const firstCommitDate = new Date(Math.min(...commitEvents.map(event => event.date.getTime())));
        firstCommitMonth = firstCommitDate.getMonth();
        firstCommitYear = firstCommitDate.getFullYear();
        
        console.log(`Setting calendar to last commit date: ${monthNames[currentMonth]} ${currentYear}`);
        
        // Update the navigation buttons
        updatePrevButtonState();
        updateNextButtonState();
    }


    function updatePrevButtonState() {
        const prevButton = document.querySelector('.btn-prev');
        
        // Disable prev button if we're at or before the first commit month
        if (currentYear < firstCommitYear || 
            (currentYear === firstCommitYear && currentMonth <= firstCommitMonth)) {
            prevButton.classList.add('disabled');
            prevButton.style.opacity = '0.5';
            prevButton.style.cursor = 'not-allowed';
        } else {
            prevButton.classList.remove('disabled');
            prevButton.style.opacity = '1';
            prevButton.style.cursor = 'pointer';
        }
    }

    // Update the next button state based on available commit months
    function updateNextButtonState() {
        const nextButton = document.querySelector('.btn-next');
        const currentIndex = findCurrentMonthIndex(commitMonthsArray);
        
        // Disable next button if we're at the last month with commits
        if (currentIndex === commitMonthsArray.length - 1) {
            nextButton.classList.add('disabled');
            nextButton.style.opacity = '0.5';
            nextButton.style.cursor = 'not-allowed';
        } else {
            nextButton.classList.remove('disabled');
            nextButton.style.opacity = '1';
            nextButton.style.cursor = 'pointer';
        }
    }

    // Update calendar with commit events
    function updateCalendarEvents(contributor = "all") {
        currentContributor = contributor;
        commitEvents = getCommitDates(contributor);
        
        // Update array of months with commits
        commitMonthsArray = getCommitMonthsArray(contributor);
        
        // Always jump to the last commit date for the selected contributor
        if (commitEvents.length > 0) {
            setCalendarToLastCommitDate(); 
        }
        
        updateCalendar(); // Refresh the calendar to show new events
        updatePrevButtonState();
        updateNextButtonState();
    }

    function updateCalendar() {
        // Update header month/year
        document.querySelector('.calendar h2').textContent = `${monthNames[currentMonth]} ${currentYear}`;

        // Clear existing calendar
        const calendarBody = document.querySelector('.calendar tbody');
        calendarBody.innerHTML = '';

        // Get first day of month (0 = Sunday, 1 = Monday, etc)
        let firstDay = new Date(currentYear, currentMonth, 1).getDay();
        // Adjust for Monday as first day of week
        firstDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        let date = 1;
        let nextMonthDate = 1;

        // Create calendar rows
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');

            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');

                if (i === 0 && j < firstDay) {
                    // Previous month days
                    const prevMonthDay = daysInPrevMonth - (firstDay - j - 1);
                    cell.textContent = prevMonthDay;
                    cell.classList.add('prev-month');
                } else if (date > daysInMonth) {
                    // Next month days
                    cell.textContent = nextMonthDate;
                    cell.classList.add('next-month');
                    nextMonthDate++;
                } else {
                    // Current month days
                    cell.textContent = date;
                    const currentDateObj = new Date(currentYear, currentMonth, date);
                    
                    // Mark date as in-range if between start and end dates
                    if (startDate && !endDate && isSelectingRange) {
                        if (isSameDay(currentDateObj, startDate)) {
                            cell.classList.add('select-day'); // Apply select-day to start date
                        }
                    } else if (startDate && endDate) {
                        // Apply select-day to both start and end dates
                        if (isSameDay(currentDateObj, startDate) || isSameDay(currentDateObj, endDate)) {
                            cell.classList.add('select-day');
                        }
                        // Apply in-range to dates between start and end
                        else if (currentDateObj > startDate && currentDateObj < endDate) {
                            cell.classList.add('in-range');
                        }
                    }

                    // Add double-click event listener to reset selection
                    cell.addEventListener('dblclick', function(e) {
                        e.preventDefault(); // Prevent any default behavior
                        
                        const selectedDay = parseInt(this.textContent);
                        const selectedDate = new Date(currentYear, currentMonth, selectedDay);
                        const today = new Date();
                        
                        // Set today to midnight for proper comparison
                        today.setHours(0, 0, 0, 0);
                        
                        // Check if selected date is in the future
                        if (selectedDate > today) {
                            document.getElementById('selected-date').textContent = "Future date selection is not possible";
                            return; // Exit the function early
                        }
                        
                        // Clear all selections
                        document.querySelectorAll('.calendar td').forEach(td => {
                            td.classList.remove('select-day');
                            td.classList.remove('in-range');
                        });
                        
                        // Reset selection and set this as the only selected date
                        startDate = selectedDate;
                        endDate = null;
                        isSelectingRange = true;
                        this.classList.add('select-day');
                        
                        // Display single date
                        document.getElementById('selected-date').textContent = formatSelectedDate(selectedDate);
                    });

                    // Add click handler for date selection
                    cell.addEventListener('click', function () {
                        const selectedDay = parseInt(this.textContent);
                        const selectedDate = new Date(currentYear, currentMonth, selectedDay);
                        const today = new Date();
                        
                        // Set today to midnight for proper comparison
                        today.setHours(0, 0, 0, 0);
                        
                        // Check if selected date is in the future
                        if (selectedDate > today) {
                            // Display error message and don't allow selection
                            document.getElementById('selected-date').textContent = "Future date selection is not possible";
                            return; // Exit the function early
                        }
                        
                        // Check if clicking on the already selected single date
                        if (startDate && !endDate && isSameDay(selectedDate, startDate)) {
                            // Clear the selection
                            document.querySelectorAll('.calendar td').forEach(td => {
                                td.classList.remove('select-day');
                                td.classList.remove('in-range');
                            });
                            startDate = null;
                            endDate = null;
                            isSelectingRange = false;
                            document.getElementById('selected-date').textContent = 'Select a date';
                            return; // Exit early
                        }
                        
                        if (!startDate || !isSelectingRange) {
                            // First click or starting a new selection
                            // Clear all selections
                            document.querySelectorAll('.calendar td').forEach(td => {
                                td.classList.remove('select-day');
                                td.classList.remove('in-range');
                            });
                            
                            startDate = selectedDate;
                            endDate = null;
                            isSelectingRange = true;
                            this.classList.add('select-day');
                            
                            
                            updateDateRangeDisplay();
                        } else if (startDate && !endDate) {
                            // Second click - complete the range
                            endDate = selectedDate;
                            
                            // Ensure startDate is the earlier date
                            if (startDate > endDate) {
                                const temp = startDate;
                                startDate = endDate;
                                endDate = temp;
                            }
                            
                            // Refresh the calendar to show the full range correctly
                            updateCalendar();
                            
                            // Update display for all dates in range
                            updateDateRangeDisplay();
                        } else if (startDate && endDate) {
                            // Third or subsequent click - extend the range
                            const extendedDate = selectedDate;
                            
                            // If the new date is before the start date, update start date
                            if (extendedDate < startDate) {
                                startDate = extendedDate;
                            } 
                            // If the new date is after the end date, update end date
                            else if (extendedDate > endDate) {
                                endDate = extendedDate;
                            } 
                            // If the new date is within the range, find the closest endpoint and update it
                            else {
                                // Calculate distances to start and end
                                const distToStart = Math.abs(extendedDate - startDate);
                                const distToEnd = Math.abs(extendedDate - endDate);
                                
                                // Update the closest endpoint
                                if (distToStart <= distToEnd) {
                                    startDate = extendedDate;
                                } else {
                                    endDate = extendedDate;
                                }
                            }
                            
                            // Refresh the calendar to show the updated range
                            updateCalendar();
                            
                            // Update display for all dates in range
                            updateDateRangeDisplay();
                        }
                    });

                    // Check if it's a commit event day
                    const hasEvent = commitEvents.some(event => 
                        date === event.date.getDate() &&
                        currentMonth === event.date.getMonth() &&
                        currentYear === event.date.getFullYear()
                    );

                    if (hasEvent) {
                        cell.classList.add('event');
                    }

                    date++;
                }

                row.appendChild(cell);
            }

            calendarBody.appendChild(row);

            // Stop if we've shown all days
            if (date > daysInMonth && i >= 4) break;
        }
    }

    // Helper function to check if two dates are the same day
    function isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    }

    // Helper function to check if a date is between two others
    function isBetweenDates(date, start, end) {
        return date >= start && date <= end;
    }

    // Update the display when a complete range is selected
    function updateDateRangeDisplay() {
        if (startDate && endDate) {
            const startFormatted = formatSelectedDate(startDate);
            const endFormatted = formatSelectedDate(endDate);
            document.getElementById('selected-date').textContent = `${startFormatted} - ${endFormatted}`;
            
            // Dispatch custom event with the date range
            const dateRangeEvent = new CustomEvent('dateRangeSelected', {
                detail: { start: startDate, end: endDate }
            });
            document.dispatchEvent(dateRangeEvent);
        } else if (startDate) {
            document.getElementById('selected-date').textContent = formatSelectedDate(startDate);
            
            
            const dateRangeEvent = new CustomEvent('dateRangeSelected', {
                detail: { start: startDate, end: null }
            });
            document.dispatchEvent(dateRangeEvent);
        } else {
            document.getElementById('selected-date').textContent = 'Select a date';
            
            // Dispatch event to reset date filter
            const dateRangeEvent = new CustomEvent('dateSelectionReset', {
                detail: { start: null, end: null }
            });
            document.dispatchEvent(dateRangeEvent);
        }
    }

    
    function formatSelectedDate(date) {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        // Add ordinal suffix to day
        let suffix = 'th';
        if (day === 1 || day === 21 || day === 31) {
            suffix = 'st';
        } else if (day === 2 || day === 22) {
            suffix = 'nd';
        } else if (day === 3 || day === 23) {
            suffix = 'rd';
        }
        
        return `${day}${suffix} ${month} ${year}`;
    }

    // Also add an event when date selection is cleared
    document.getElementById('selected-date').addEventListener('click', function() {
        // Clear all selections when clicking on the date display
        document.querySelectorAll('.calendar td').forEach(td => {
            td.classList.remove('select-day');
            td.classList.remove('in-range');
        });
        startDate = null;
        endDate = null;
        isSelectingRange = false;
        this.textContent = 'Select a date';
        
        // Dispatch event to reset the filter
        const dateRangeEvent = new CustomEvent('dateSelectionReset', {
            detail: { start: null, end: null }
        });
        document.dispatchEvent(dateRangeEvent);
    });

    // Setup navigation buttons
    // Modify the prev button click handler to skip to previous month with commits
    document.querySelector('.btn-prev').addEventListener('click', function (e) {
        e.preventDefault();
        
        const currentIndex = findCurrentMonthIndex(commitMonthsArray);
        
        // Check if we have a previous month with commits
        if (currentIndex > 0) {
            const prevMonth = commitMonthsArray[currentIndex - 1];
            currentMonth = prevMonth.month;
            currentYear = prevMonth.year;
            updateCalendar();
            updatePrevButtonState();
            updateNextButtonState();
        }
        
        setTimeout(updateDateRangeDisplay, 10);
    });

    // Update the next button click handler to skip to next month with commits
    document.querySelector('.btn-next').addEventListener('click', function (e) {
        e.preventDefault();
        
        const currentIndex = findCurrentMonthIndex(commitMonthsArray);
        
        // Check if we have a next month with commits
        if (currentIndex < commitMonthsArray.length - 1) {
            const nextMonth = commitMonthsArray[currentIndex + 1];
            currentMonth = nextMonth.month;
            currentYear = nextMonth.year;
            updateCalendar();
            updatePrevButtonState();
            updateNextButtonState();
        }
        
        setTimeout(updateDateRangeDisplay, 10);
    });

    // Listen for dropdown changes
    document.getElementById('mySelect').addEventListener('change', function() {
        const selectedValue = this.value;
        updateCalendarEvents(selectedValue);
    });

    // Add a listener specifically for user-initiated contributor changes
    document.getElementById('mySelect').addEventListener('contributorChanged', function(event) {
        const selectedValue = event.detail.value;
        
        // Clear all date selections
        document.querySelectorAll('.calendar td').forEach(td => {
            td.classList.remove('select-day');
            td.classList.remove('in-range');
        });
        
        // Reset date selection variables
        startDate = null;
        endDate = null;
        isSelectingRange = false;
        
        // Update the text to prompt for date selection
        document.getElementById('selected-date').textContent = 'Select a date for ' + event.detail.text;
        
        // Dispatch event to reset date filters but maintain contributor selection
        const dateResetEvent = new CustomEvent('dateSelectionReset', {
            detail: { contributor: selectedValue }
        });
        document.dispatchEvent(dateResetEvent);
        
        // Update calendar events for this contributor
        updateCalendarEvents(selectedValue);
    });

    // Initialize the calendar when allCommits is available
    // This uses a polling approach to wait for the data
    const checkForCommitData = setInterval(function() {
        if (window.allCommits && Array.isArray(window.allCommits)) {
            clearInterval(checkForCommitData);
            updateCalendarEvents("all"); // Initialize with all commits
        }
    }, 100);

    
    document.getElementById('reset-charts-button').addEventListener('click', function() {
        // Clear all selections from the calendar UI
        document.querySelectorAll('.calendar td').forEach(td => {
            td.classList.remove('select-day');
            td.classList.remove('in-range');
        });
        
        // Reset selection state variables
        startDate = null;
        endDate = null;
        isSelectingRange = false;
        
        // Reset the date display
        document.getElementById('selected-date').textContent = 'Select a date';
        
        // Get current selected contributor to maintain that selection while resetting dates
        const contributorDropdown = document.getElementById('mySelect');
        const currentContributor = contributorDropdown ? contributorDropdown.value : "1";
        
        // Dispatch a comprehensive reset event with details for all charts
        const dateRangeEvent = new CustomEvent('dateSelectionReset', {
            detail: { 
                start: null, 
                end: null, 
                contributor: currentContributor,
                isCompleteReset: true
            }
        });
        document.dispatchEvent(dateRangeEvent);
    });
});
