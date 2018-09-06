let util = {

};
util.title = function (title) {
    title = title ? title + ' - Home' : 'baidupcs-web';
    window.document.title = title;
};

export default util;