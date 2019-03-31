d3.json('/news').then(news => {
    console.log(news)
    slide_container = d3.select('#carousel-inner')
    slide_container.selectAll('div')
       .data(news)
       .enter()
       .append("div")
       .classed("carousel-item", true)
       .html(newsitem => {
           // console.log(newsitem)
           return `<a href="${newsitem.href}" target="_blank"> \
                        <img class="img-fluid d-block w-100"  title="${newsitem.teaser}" src="${newsitem.image}"  width="100%">  </a> \
                   <div> \
                      <p>${newsitem.title} \
                      <span class="badge badge-info">click on image</span> </p>\
                   </div>`
       })
     slide_container.select(".carousel-item").classed("active", true)
});