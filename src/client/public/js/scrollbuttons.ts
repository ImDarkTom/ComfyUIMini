import { scrollToBottom, scrollToTop } from './common/scroll.js';

const scrollTopButton = document.getElementById('scroll-top') as HTMLElement;
const scrollBottomButton = document.getElementById('scroll-bottom') as HTMLElement;

scrollTopButton.addEventListener('click', () => scrollToTop());
scrollBottomButton.addEventListener('click', () => scrollToBottom());

document.addEventListener('scroll', () => {
    const totalPageHeight = document.body.scrollHeight;

    const scrollPoint = window.scrollY + window.innerHeight;

    if (scrollPoint >= totalPageHeight) {
        scrollBottomButton.style.visibility = 'hidden';
    } else {
        scrollBottomButton.style.visibility = 'visible';
    }

    if (scrollPoint <= window.innerHeight) {
        scrollTopButton.style.visibility = 'hidden';
    } else {
        scrollTopButton.style.visibility = 'visible';
    }
});
