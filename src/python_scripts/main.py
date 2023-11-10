
import sys

PATH = "./static/images/"

if __name__ == "__main__":
    

    args = sys.argv
    fileName = args[1]
    sys.stdout.write(f'{fileName}\n')
    # sys.stderr.write('Here goes error message\n')