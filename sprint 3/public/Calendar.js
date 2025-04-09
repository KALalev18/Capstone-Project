document.addEventListener('DOMContentLoaded', function () {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let commitEvents = []; // Will store all commit events
    let firstCommitMonth;
    let firstCommitYear;

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

    // Add this function to update the prev button state
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

                    // Check if it's today
                    if (date === currentDate.getDate() && 
                        currentMonth === currentDate.getMonth() && 
                        currentYear === currentDate.getFullYear()) {
                        cell.classList.add('current-day');
                    }

                    // Add click handler to make any date the "current" date when clicked
                    cell.addEventListener('click', function () {
                        // Remove current-day class from all cells
                        document.querySelectorAll('.calendar td').forEach(td => {
                            td.classList.remove('current-day');
                        });

                        // Add current-day class to clicked cell
                        this.classList.add('current-day');
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
    });

    // Listen for dropdown changes
    document.getElementById('mySelect').addEventListener('change', function() {
        const selectedValue = this.value;
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
});
