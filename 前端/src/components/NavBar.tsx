import React from 'react';

const NavBar = ({ onViewChange }: { onViewChange: (view: string) => void }) => {
  const menuItems = [
    { name: '仪表盘', id: 'dashboard' },
    { name: '能力地图', id: 'map' },
    { name: '评估闯关', id: 'assessment' },
    { name: '职业探索', id: 'career' },
    { name: '学习路线', id: 'path' },
    { name: '我的学校', id: 'school' },
  ];

  return (
    <div className="navbar bg-base-100 shadow-sm rounded-2xl mb-4">
      <ul className="menu menu-horizontal px-1 w-full flex justify-between">
        {menuItems.map((item) => (
          <li key={item.id}>
            <a onClick={() => onViewChange(item.id)}>{item.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NavBar;
