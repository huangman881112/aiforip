import React from 'react'

function ReactTest() {
  return (
    <div className="react-test">
      <h3>React 组件测试</h3>
      <p>这是一个在Vue项目中嵌入的React组件</p>
      <p>当前时间: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}

export default ReactTest