/** Runs before the page is drawn (in the layout), so a saved Light or Dark choice does not flash the other theme first. */
export const themeInitScript = `try{var t=JSON.parse(localStorage.getItem("mp.theme.v1"));if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
