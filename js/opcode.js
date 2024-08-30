// JavaScript for real-time search
document.getElementById('searchInput').addEventListener('input', function() {

    var input = this.value.toLowerCase();
    var rows = document.querySelectorAll('#opcodeTable tbody tr');

    rows.forEach(function(row) {
        var cells = row.getElementsByTagName('td');
        var found = false;

        for (var i = 0; i < cells.length; i++) {
            if (cells[i].textContent.toLowerCase().includes(input)) {
                found = true;
                break;
            }
        }

        row.style.display = found ? '' : 'none';
    });
});

