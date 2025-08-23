var ids = [];
var notesIds = [];
const map = new Map();

var idStorage;

function getData() {
    var note;
    var storage = localStorage;
    const keysArray = Array.from(storage);
    keys = Object.keys(localStorage);
    i = keys.length;
    while (i--) {
        if (localStorage.getItem(keys[i]) != null) {
            notesIds.push(keys[i]);

<<<<<<< HEAD
        }
    }
    notesIds.sort();
    for (var i = 0; i <= notesIds.length; i++) {

        id = notesIds[i];

        if (storage.getItem(id) != null) {
            addNote(id);
            var content = storage.getItem(id);

            map.set(id, content);
            note = document.getElementById(id);

            note.childNodes.item(2).textContent = content;
        }
    }

}
=======
    for (var i = 0; i <= localStorage.length; i++) {
        idStorage = Object.keys(storage);
        idStorage.sort((a, b) => a - b);
        while (ids.length < localStorage.length) {
            var id = parseInt(idStorage[i]);
            var content = storage.getItem(id);
            addNote(id);
            note = document.getElementById(id);
            if (note.id == storage.key(parseInt(id))) {
                note.children.item(0).value = content;
            }
            else {
                var x = tryAgain(note.id, localStorage.key(id));
                if (x == note.id) {
                    note.children.item(0).value = localStorage[id];
                }
            }
            i++;
        }
    }

    function tryAgain(x, y) {
        if (y = x) {
            return y;
        }
        else {
            y = +1;
            return y + tryAgain(x = x, y = y);
        }
    }
}
>>>>>>> 4a85ab35bbeb1f393426dd2fdf94097449b74486
