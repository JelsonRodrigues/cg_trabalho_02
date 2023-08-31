import cv2
import numpy as np

image_path = "C:/Users/jelso/Documents/Scripts/cg_trabalho_02/src/objects/Terrain/Mountain Range Height Map PNG.png"

img = cv2.imread(image_path, -1)

new_img = np.zeros(img.shape, np.uint8)

for row in range(0, img.shape[0]):
    for column in range(0, img.shape[1]):
        value = img[row][column][0]
        high_bits = (value & 0b1111111100000000) >> 8
        low_bits  = value & 0b0000000011111111
        # B G R
        new_img[row][column][0] = 0
        new_img[row][column][1] = low_bits
        new_img[row][column][2] = high_bits

cv2.imwrite("./out.png", new_img)