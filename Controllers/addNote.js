var divToAddNotes = document.getElementById('notesList');

function addNote(id = 0) {
    var noteId;
    noteId = checkNoteId(id);
    var newNote = createNote(noteId);
    var lastId = notesIds[notesIds.length - 1] + 1;

    if (noteId == 0) {
        divToAddNotes.insertBefore(newNote, divToAddNotes.children.item(0));
    } else {
        var foo = divToAddNotes.children.namedItem(`${lastId}`)
        divToAddNotes.insertBefore(newNote, foo);
    }
    function createNote(noteIndex) {
        noteInput = " <textarea id= label class='form-control' rows='3'></textarea>";
        var note = document.createElement('li');
        note.className = `note`;
        note.id = noteIndex;
        deleteNoteButton = `<button class="deleteNote" onclick= deleteNote(${noteIndex})>x</i></button>`
        note.title = noteIndex;
        note.innerHTML += deleteNoteButton;
        note.innerHTML += noteInput;
        return note;
    }

    function checkNoteId(id) {
        for (var i = 0; i <= notesIds.length; i++) {
            if (notesIds[i] == id) {
                // console.log('id used');
                id++
            } else {
                //console.log(`${id} unused`)
                map.set(id, '');
                notesIds.push(id);
                //ids.sort((a, b) => a - b)
                i = notesIds.length + 1;
                // console.log(ids);
                return id;
                //console.log(ids[i]);
            }
        }

    }


}