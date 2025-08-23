var divToAddNotes = document.getElementById('notesList');

function addNote(id = 0) {
    var noteId;
    noteId = checkNoteId(id);
    var newNote = createNote(noteId);
<<<<<<< HEAD
    var lastId = notesIds[notesIds.length - 1] + 1;

    if (noteId == 0) {
=======
    var lastId = ids[idsLength];
    
    if(noteId == 1){
        var positionBeforeButton = divToAddNotes.children.length-1;
        divToAddNotes.insertBefore(newNote, divToAddNotes.children.item(positionBeforeButton));
    }else if (noteId < lastId)
    {
        addIndex = noteId-1
        var foo =divToAddNotes.children.namedItem(`${addIndex}`)
        divToAddNotes.insertBefore(newNote, foo);
    } else {
>>>>>>> 4a85ab35bbeb1f393426dd2fdf94097449b74486
        divToAddNotes.insertBefore(newNote, divToAddNotes.children.item(0));
    } else {
        var foo = divToAddNotes.children.namedItem(`${lastId}`)
        divToAddNotes.insertBefore(newNote, foo);
    }
    function createNote(noteIndex) {
<<<<<<< HEAD
        noteInput = " <textarea id= label class='form-control' rows='3'></textarea>";
        var note = document.createElement('li');
        note.className = `note`;
        note.id = noteIndex;
        deleteNoteButton = `<button class="deleteNote" onclick= deleteNote(${noteIndex})>x</i></button>`
=======
        
        noteInput = "<textarea name='Text' rows='10' cols='20'>";
        var note = document.createElement('li');
        note.className = `note`;
        note.id = noteIndex;
        console.log(noteIndex);
        deleteNoteButton = `<button onclick= deleteNote(${noteIndex})>X</button>`
>>>>>>> 4a85ab35bbeb1f393426dd2fdf94097449b74486
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