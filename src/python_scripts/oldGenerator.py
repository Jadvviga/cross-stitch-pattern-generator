from PIL import Image
"""
Program to convert pixel art/image to cross-stitch pattern (the same image but with a grid).
1 pixel == 1 cross
Takes png and converts it to png (the colors stay the same)
Does not say number of embroidery floss, but counts how many colors are used.
"""


cross_width = 6
colors = []
GRID_COLOR = (0, 0, 0)
GRID_COLOR_DARK = (225, 225, 225)

def generate_pattern(image, path):
    og_sizeX, og_sizeY = image.size
    # og size will be x6 (cross width) + grid itself
    sizeX = og_sizeX*cross_width + og_sizeX+1
    sizeY = og_sizeY*cross_width + og_sizeY+1
    pattern = Image.new("RGB", (sizeX, sizeY))

    counterX, counterY = 0,0
    ifGrid = True

    for y in range(sizeY):
        for x in range(sizeX):
            if (y % (cross_width + 1) == 0 or y == 0):
                ifGrid = True
            # if we got through cross_width in Y axis
            pixel = image.getpixel((counterX, counterY))
            # if we got through cross_width in Y axis
            if(x%(cross_width+1) == 0 or x == 0):
                ifGrid = True
                #increase counterX if we are on the grid after the current pixel
                if(x!=0):
                    counterX += 1

            if(ifGrid):
                pattern.putpixel((x, y), GRID_COLOR)
                ifGrid = False

            else:
                pattern.putpixel((x, y), pixel)

        counterX = 0
        if (y % (cross_width+1) == 0 and y!=0):
            counterY += 1



    pattern.save(path)
    pattern.close()


def generate_palette(image, path):
    sizeX, sizeY = image.size

    for y in range(sizeY):
        for x in range(sizeX):
            pixel = image.getpixel((x, y))
            if pixel not in colors:
                colors.append(pixel)

    palette = Image.new("RGB", (len(colors), 1))
    for x, color in enumerate(colors):
        palette.putpixel((x, 0), color)

    palette.save(path)
    palette.close()


def add_black_grid(img_path):
    img = Image.open(img_path)
    sizeX, sizeY = img.size

    pixel_size = (cross_width+1)*5 #pizel + grid (1) times how often we want balck grid

    for y in range(sizeY):
        for x in range(sizeX):
            pixel = img.getpixel((x, y))
            if(x % pixel_size == 0 or y % pixel_size == 0):
                img.putpixel((x, y), GRID_COLOR_DARK)

    img.save(img_path)
    img.close()



if __name__ == "__main__":
    img_name = "bionicle"

    img = Image.open(img_name + ".png")
    generate_pattern(img, img_name + "_pattern.png")
    print("Saved file as " + img_name + "_pattern.png")
    generate_palette(img, img_name + "_palette.png")

    add_black_grid(img_name + "_pattern.png")

    print("Saved color palette as " + img_name + "_palette.png")
    print(f"Number of colors: {len(colors)}"  )
    # for color in colors:
    #     print(color)
    img.close()