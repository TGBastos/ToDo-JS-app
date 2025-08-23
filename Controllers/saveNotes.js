var values = [];
function saveNotes() {
    var lastIdPosition = ids.length - 1;
    var lastId = ids[lastIdPosition];
    var id;
    var note;
    var noteContent;
    var noteTitle;
    for (var i = 0; i <= notesIds.length; i++) {
        if (map.get(i) != undefined) {
            console.log("olaaaaaaaaaaaaaaa" + i);
            note = document.getElementById(`${i}`);
            noteContent = note.childNodes.item(2).value;
            console.log(noteContent);
            localStorage.setItem(i, noteContent)
            console.log("SAVED");
        }
    }
}
