import os

def convert_line_endings(file_path):
    """
    Конвертирует окончания строк в файле из CRLF (Windows) в LF (Unix).

    Открывает файл в бинарном режиме, заменяет все вхождения \r\n на \n
    и перезаписывает файл с новыми окончаниями строк.
    """
    with open(file_path, 'rb') as file:
        content = file.read()
    
    content = content.replace(b'\r\n', b'\n')
    
    with open(file_path, 'wb') as file:
        file.write(content)

if __name__ == "__main__":
    convert_line_endings('wait-for-it.sh')