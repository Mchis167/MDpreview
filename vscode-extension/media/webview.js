(function () {
  const content = document.getElementById('md-content');

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'render') {
      content.innerHTML = message.html;
    }
  });
})();
