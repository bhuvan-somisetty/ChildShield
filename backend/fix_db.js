const { sequelize, Child, Parent } = require('./src/db');

async function fix() {
  // 1. Fix children — link paired children to the Google OAuth parent
  const parent = await Parent.findOne({ where: { email: 'somisettybhuvan5@gmail.com' } });
  if (parent) {
    console.log('Found parent:', parent.id, parent.fullName);
    
    // Link the most recent paired child
    const children = await Child.findAll({ where: { isPaired: true, parentId: null } });
    for (const child of children) {
      await sequelize.query(`UPDATE Children SET parentId = '${parent.id}' WHERE id = '${child.id}'`);
      console.log(`Linked child "${child.name}" (${child.id}) to parent ${parent.id}`);
    }
    
    // 2. Set needsPasswordSetup = true for Google OAuth user 
    await sequelize.query(`UPDATE Parents SET needsPasswordSetup = 1 WHERE id = '${parent.id}'`);
    console.log('Set needsPasswordSetup = true for', parent.email);
  }

  // Verify
  const updated = await Child.findAll({ include: [{ model: Parent, required: false }] });
  updated.forEach(c => console.log('Child:', c.name, 'parentId:', c.parentId, 'hasParent:', !!c.Parent));
  
  process.exit(0);
}
fix();
