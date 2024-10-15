$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

$('body').on('click', '#soikeos-user', function () {
    var userURL = $(this).data('url');
    var trObj = $(this);
    if(confirm("Xóa mà không thể khôi phục. Bạn có chắc ?") == true){
        $.ajax({
            url: userURL,
            type: 'DELETE',
            dataType: 'json',
            success: function(data) {
                alert(data.success);
                trObj.parents("tr").remove();
            }
        });
    }
 });

// function removeRow(id, url) {
//     if (confirm('Xóa mà không thể khôi phục. Bạn có chắc ?')) {
//         $.ajax({
//             type: 'DELETE',
//             datatype: 'JSON',
//             url: url+'/'+id,
//             success: function (result) {
//                 if (result.error === false) {
//                     alert(result.message);
//                     location.reload();
//                 } else {
//                     alert('Xóa lỗi vui lòng thử lại');
//                 }
//             }
//         })
//     }
// }


/*Upload File */
$('#upload').change(function () {
    const form = new FormData();
    form.append('file', $(this)[0].files[0]);

    $.ajax({
        processData: false,
        contentType: false,
        type: 'POST',
        dataType: 'JSON',
        data: form,
        url: '/admin/upload/services',
        success: function (results) {
            if (results.error === false) {
                $('#image_show').html('<a href="' + results.url + '" target="_blank">' +
                    '<img src="' + results.url + '" width="100px"></a>');
                $('#thumb').val(results.url);
            } else {
                alert('Upload File Lỗi');
            }
        }
    });
});
