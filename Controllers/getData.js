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
