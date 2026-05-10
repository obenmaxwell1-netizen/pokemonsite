const fs = require('fs');
const files = ['index.html', 'admin.html', 'cart.html', 'catalog.html', 'product.html', 'track.html'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add Favicon
  if (!content.includes('<link rel="icon"')) {
    content = content.replace('</head>', '  <link rel="icon" type="image/jpeg" href="logo.jpeg">\n</head>');
  }

  // Update Nav Logo
  content = content.replace(
    '<a href="index.html" class="nav-logo">⚡ Pokepluse</a>', 
    '<a href="index.html" class="nav-logo"><img src="logo.jpeg" alt="Pokepluse" style="height:32px; border-radius:4px;"> Pokepluse</a>'
  );
  
  // Also auth.html might have a different logo
  content = content.replace(
    '<a href="index.html" class="auth-logo"><i class="fa fa-bolt" style="color:var(--gold);"></i> Pokepluse</a>',
    '<a href="index.html" class="auth-logo"><img src="logo.jpeg" alt="Pokepluse" style="height:40px; border-radius:4px; vertical-align:middle;"> Pokepluse</a>'
  );
  
  // admin.html also has a sidebar logo
  content = content.replace(
    '<a href="index.html" class="sidebar-logo">⚡ Pokepluse Admin</a>',
    '<a href="index.html" class="sidebar-logo"><img src="logo.jpeg" alt="Pokepluse" style="height:24px; border-radius:4px; margin-right:8px; vertical-align:middle;"> Pokepluse Admin</a>'
  );

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
