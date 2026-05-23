export default function InterviewPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 左侧：阶段指示器 */}
      <aside className="w-64 border-r p-4">
        <h3 className="font-semibold mb-4">面试流程</h3>
        {/* TODO: StageIndicator 组件 */}
        <p className="text-sm text-muted-foreground">阶段指示器待实现</p>
      </aside>

      {/* 中间：对话区域 */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {/* TODO: ChatPanel 组件 */}
          <p className="text-muted-foreground">对话面板待实现</p>
        </div>
        <div className="border-t p-4">
          {/* TODO: 输入框 + 控制栏 */}
          <p className="text-sm text-muted-foreground">输入区域待实现</p>
        </div>
      </div>

      {/* 右侧（算法面时）：代码编辑器 */}
      <aside className="w-96 border-l p-4">
        {/* TODO: CodeEditor 组件 */}
        <p className="text-sm text-muted-foreground">代码编辑器待实现</p>
      </aside>
    </div>
  );
}
