function deleteNote(id) {
    localStorage.removeItem(id);
    var note = document.getElementById(`${id}`);
    note.remove();
    map.delete(id);
    notesIds.pop(id);
}