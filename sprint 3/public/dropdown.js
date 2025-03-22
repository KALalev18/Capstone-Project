function create_custom_dropdowns() {
    const selects = document.querySelectorAll('select');

    selects.forEach(function (select, i) {
        if (!select.nextElementSibling || !select.nextElementSibling.classList.contains('dropdown-select')) {
            const dropdown = document.createElement('div');
            dropdown.classList.add('dropdown-select', 'wide', ...(select.className ? select.className.split(' ') : []));
            dropdown.tabIndex = 0;
            dropdown.innerHTML = '<span class="current"></span><div class="list"><ul></ul></div>';
            select.parentNode.insertBefore(dropdown, select.nextSibling);

            const options = select.querySelectorAll('option');
            let selectedOption = select.options[select.selectedIndex];

            dropdown.querySelector('.current').textContent = selectedOption.dataset.displayText || selectedOption.textContent;

            options.forEach(function (o, j) {
                const display = o.dataset.displayText || '';
                const li = document.createElement('li');
                li.classList.add('option');
                if (o.selected) {
                    li.classList.add('selected');
                }
                li.dataset.value = o.value;
                li.dataset.displayText = display;
                li.textContent = o.textContent;
                dropdown.querySelector('ul').appendChild(li);
            });
        }
    });

    const lists = document.querySelectorAll('.dropdown-select ul');
    lists.forEach(list => {
        const searchDiv = document.createElement('div');
        searchDiv.classList.add('dd-search');
        searchDiv.innerHTML = '<input id="txtSearchValue" autocomplete="off" class="dd-searchbox" type="text">';
        list.parentNode.insertBefore(searchDiv, list);
        searchDiv.querySelector('input').addEventListener('keyup', filter);
    });
}

// Event listeners

// Open/close
document.addEventListener('click', function (event) {
    let target = event.target;
    if (target.classList.contains('dd-searchbox')) {
        return;
    }

    let dropdown = target.closest('.dropdown-select');
    if (dropdown) {
        document.querySelectorAll('.dropdown-select').forEach(function (el) {
            if (el !== dropdown) {
                el.classList.remove('open');
            }
        });
        dropdown.classList.toggle('open');
        if (dropdown.classList.contains('open')) {
            dropdown.querySelectorAll('.option').forEach(option => option.tabIndex = 0);
            dropdown.querySelector('.selected').focus();
        } else {
            dropdown.querySelectorAll('.option').forEach(option => option.removeAttribute('tabindex'));
            dropdown.focus();
        }
    } else {
        document.querySelectorAll('.dropdown-select').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.dropdown-select .option').forEach(option => option.removeAttribute('tabindex'));
    }
});

// Close when clicking outside
document.addEventListener('click', function (event) {
    if (!event.target.closest('.dropdown-select')) {
        document.querySelectorAll('.dropdown-select').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.dropdown-select .option').forEach(option => option.removeAttribute('tabindex'));
    }
    event.stopPropagation();
});

function filter() {
    const valThis = document.getElementById('txtSearchValue').value.toLowerCase();
    document.querySelectorAll('.dropdown-select ul > li').forEach(function (li) {
        const text = li.textContent.toLowerCase();
        li.style.display = text.indexOf(valThis) > -1 ? '' : 'none';
    });
}
// Search

// Option click
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('option')) {
        const option = event.target;
        const list = option.closest('.list');
        list.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        option.classList.add('selected');
        const text = option.dataset.displayText || option.textContent;
        option.closest('.dropdown-select').querySelector('.current').textContent = text;
        const select = option.closest('.dropdown-select').previousElementSibling;
        select.value = option.dataset.value;
        select.dispatchEvent(new Event('change'));
    }
});

// Keyboard events
document.addEventListener('keydown', function (event) {
    let target = event.target;
    if (target.classList.contains('dropdown-select')) {
        const focused_option = target.querySelector('.list .option:focus') || target.querySelector('.list .option.selected');

        if (event.key === 'Enter') {
            if (target.classList.contains('open')) {
                focused_option.click();
            } else {
                target.click();
            }
            event.preventDefault();
        } else if (event.key === 'ArrowDown') {
            if (!target.classList.contains('open')) {
                target.click();
            } else {
                let next = focused_option.nextElementSibling;
                if (next) {
                    next.focus();
                }
            }
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            if (!target.classList.contains('open')) {
                target.click();
            } else {
                let prev = focused_option.previousElementSibling;
                if (prev) {
                    prev.focus();
                }
            }
            event.preventDefault();
        } else if (event.key === 'Escape') {
            if (target.classList.contains('open')) {
                target.click();
            }
            event.preventDefault();
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    create_custom_dropdowns();
});