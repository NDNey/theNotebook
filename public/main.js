const edit = document.querySelector("#edit");
const trash = document.getElementsByClassName("fa-trash-o");
const params = new URLSearchParams(window.location.search)
const editKey = document.querySelector('#key')
const editTitle = document.querySelector('#title')
const editText = document.querySelector('#text')

console.log('hello', params.get('id'))

 


Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(e){
        const title = this.parentNode.parentNode.parentElement.firstElementChild.nextElementSibling.innerText
       
    
       
 
        fetch('messages', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'title': title,
            
            // 'msg': msg
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});

edit.addEventListener('click', function(){

        
        fetch('edit', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            
            'title': params.get('title'),
            'newKey':editKey.value,
            'newTitle':editTitle.value,
            'newText': editText.value ,
        

          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
 