import { scrollToBottom, scrollToTop } from "./common/scroll.js";

const scrollTopButton = document.getElementById('scroll-top') as HTMLElement;
const scrollBottomButton = document.getElementById('scroll-bottom') as HTMLElement;

scrollTopButton.addEventListener('click', () => scrollToTop());
scrollBottomButton.addEventListener('click', () => scrollToBottom());
