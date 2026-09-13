import '@testing-library/jest-dom'

// jsdom 不实现 Element.scrollTo，而对话流「自动滚到最新」会调用它
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {}
}
