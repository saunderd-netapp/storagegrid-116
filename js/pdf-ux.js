$(document).ready(function () {
  try {
    // intialize config variables
    let zipLevel = "";
    let baseUrlSection = "/us-en/storagegrid-116/pdfs/sidebar/";
    let baseUrlPages = "/us-en/storagegrid-116/pdfs/pages/";
    let zipFilename = "";
    let zipFileSize = 0;
    zipLevel = zipLevel !== ""?zipLevel:1;
    zipFilename = zipFilename !== ''?zipFilename:"storagegrid-116.zip";
    
    // remove container class from pdf tree not having any sub child
    $("#toggleContainerPdf li.pdf-ux-container").not(".active").removeClass("pdf-ux-container");
    // scroll the mysidebar to the current active link
    $(".sidebar-nav-container").scrollTop(($(".sidebar-nav-container>#mysidebar  li.active:last").offset().top) - ($(".sidebar-nav-container").offset().top + 100));

    // construct pdf urls only once
    const pdfUrls = getPdfUrls(zipLevel, baseUrlSection, baseUrlPages);
    if(pdfUrls.length > 0) {
      zipPdf();
    }
    // parse sidebar links recursively and build level hierarchy
    function traverseDOM(ul, prefix = '') {
      return [].concat(...Array.from(ul.children).map(li => {
        if (li.children.length > 1) {
          // Need equivalent of [:alnum:] for i18n. [A-Za-z0-9] will remove i18n chars.
          return traverseDOM(li.querySelector('ul'), prefix + li.querySelector('a').textContent.trim().replace(/\s|\-|\,|\(|\)|\[|\]|\;|\'|\.|\:/g, "_") + '.pdf::section|');
        } else {
          let url = li.querySelector('a').getAttribute('href');
          if(url.indexOf("http")===-1){
            pdfName = url.substring(url.lastIndexOf('/') + 1).replace('html', 'pdf::page');
            return prefix + pdfName;
          }
          else return ""
        }
      }));
    }

    // get pdf urls for a specific level
    function getPdfUrls(zipLevel, baseUrlSection, baseUrlPages){
      const pdfUrls = [];
      const sidebarLinksNodeList = $(".ie-main>.col-md-3 ul#mysidebar")[0];
      const arr = traverseDOM(sidebarLinksNodeList);
      // remove the root level pdf
      arr.shift();
      // construct the pdf urls by checking which base folder to point at
      arr.forEach(item=>{
        if(item !== ""){
          let pdfNames = item.split('|');
          for(let i=0; i<zipLevel; i++){
            let [pdfName, baseUrlType] = pdfNames[i].split("::");
            let url = baseUrlType === "section"?(baseUrlSection+pdfName):(baseUrlPages+pdfName);
            if(pdfUrls.indexOf(url)===-1) pdfUrls.push(url);
          }
        }
      });
      return pdfUrls;
    }

    // zip all pdf files
    function zipPdf(){
      let zip = new JSZip();
      let count = 0;
      // disable link and start spinner
      if(zipFileSize != 0) {
        $("#zip-link-popup").removeClass("hide");
      }
      pdfUrls.forEach(function(url){
        let filename = url.substring(url.lastIndexOf('/')+1);
        // loading a file and add it in a zip file
        JSZipUtils.getBinaryContent(url, function (err, data) {
          if(err) {
              count++;
              throw err;
          }
          count++;
          zip.file(filename, data, {binary:true});
          if (count == pdfUrls.length) {
            zip.generateAsync({type:'blob'}).then(function(content) {
              if(zipFileSize == 0) {
                zipFileSize = (content.size/1000000).toFixed();
                $('#zipPdf .zip-size').text('['+zipFileSize+'MB]');
              }
              else {
                if(!$("#zip-link-popup").hasClass("hide")) {
                  saveAs(content, zipFilename);
                  // enable link and stop spinner
                  $("#zip-link-popup .downloading-progress").addClass("hide");
                  $("#zip-link-popup .download-complete").removeClass("hide");
                  setTimeout(function(){
                    $("#zip-link-popup").addClass("hide");
                    $("#zip-link-popup .downloading-progress").removeClass("hide");
                    $("#zip-link-popup .download-complete").addClass("hide");
                  },2000);
                }
              }
            });
          }
        });
      });
    }

    // bind zipPdf link click
    $("#zipPdf").click(function(event){
      event.preventDefault();
      zipPdf();
      event.stopImmediatePropagation();
    });
  } catch (err) {
    console.log(err.message);
    // enable link and stop spinner
    $("#zip-link-popup").addClass("hide");
  }
});
