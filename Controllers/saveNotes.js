var values = [];
function saveNotes() {
    var lastIdPosition = ids.length - 1;
    var lastId = ids[lastIdPosition];
    var id;
    var note;
    var noteContent;
    var noteTitle;
<<<<<<< HEAD
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
=======

    for (var i = 0; i <= lastId; i++) {
        console.log(i);
        id = getExistentIds(i = i);
        console.log(id);
        note = document.getElementById(`${id}`);
        noteContent = note.children.item(0).value;
        noteTitle = note.getAttribute('title');
        if (noteContent != '') {
            values.push(`${noteTitle}=${noteContent}`);
            //console.log('foi com tudo');
        } else {
            values.push(`${noteTitle}=`)
            //console.log('foi com nada');
        }

    }

    for (i in values) {
        var valueToSave = values[i].split('=');
        localStorage.setItem(valueToSave[0], valueToSave[1]);
    }



    function getExistentIds(i = 1, x = 0) {

        if (i != ids[x] && ids[x] != undefined) {
            //console.log(`Elemento n encontrado no index ${x}, procurando no próximo index`);
            x += 1;
            return getExistentIds(i = i, x);
        } else if (i != ids[x] && ids[x] == undefined) {
            //console.log(`o elemento ${i} não foi encontrado no banco, procurando proximo elemento`);
            i += 1;
            return getExistentIds(i, x = 0);
        } else {
            //console.log(`o elemento ${i} foi encontrado no index ${x}`);
            return ids[x];
        }
    }

}



>>>>>>> 4a85ab35bbeb1f393426dd2fdf94097449b74486
