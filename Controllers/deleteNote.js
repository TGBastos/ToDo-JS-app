function deleteNote(id) {
<<<<<<< HEAD
    localStorage.removeItem(id);
    var note = document.getElementById(`${id}`);
    note.remove();
    map.delete(id);
    notesIds.pop(id);
=======
    var arrayIndex = ids.indexOf(id);
    console.log(arrayIndex);
    ids.splice(arrayIndex, 1);
    localStorage.removeItem(id);
    var note = document.getElementById(`${id}`);
    note.remove();
>>>>>>> 4a85ab35bbeb1f393426dd2fdf94097449b74486
}