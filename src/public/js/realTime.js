const socket = io();

document.getElementById('formAgregar').addEventListener('submit', (e) => {
  e.preventDefault();
  const nuevoProducto = {
    title: document.getElementById('title').value,
    price: document.getElementById('price').value,
    description: "Descripción mágica",
    code: "MAG" + Date.now(),
    stock: 10,
    category: "magia"
  };
  socket.emit('nuevoProducto', nuevoProducto);
});

document.getElementById('formEliminar').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('idEliminar').value);
  socket.emit('eliminarProducto', id);
});

socket.on('actualizarProductos', (productos) => {
  const lista = document.getElementById('listaProductos');
  lista.innerHTML = productos.map(p => 
    `<li>${p.title} - $${p.price} (ID: ${p.id})</li>`
  ).join('');
});